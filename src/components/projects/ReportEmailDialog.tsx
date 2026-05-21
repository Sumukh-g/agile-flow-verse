import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Copy, Eye, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { api } from '@/lib/api';

interface ReportEmailDialogProps {
  projectId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType?: 'summary' | 'full';
}

const ReportEmailDialog: React.FC<ReportEmailDialogProps> = ({ 
  projectId, 
  open, 
  onOpenChange,
  reportType = 'summary'
}) => {
  const { data: membersData } = useProjectMembers(projectId);
  const members = membersData?.members || [];
  
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [externalEmails, setExternalEmails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{ subject: string; body: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const allRecipients = useMemo(() => {
    const memberEmails = members
      .filter((m: any) => selectedMemberIds.has(m.userId))
      .map((m: any) => m.user?.email)
      .filter(Boolean);
    
    const external = externalEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));
    
    return [...memberEmails, ...external];
  }, [selectedMemberIds, externalEmails, members]);

  const handleMemberToggle = (userId: string) => {
    const newSet = new Set(selectedMemberIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedMemberIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedMemberIds.size === members.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(members.map((m: any) => m.userId)));
    }
  };

  const handlePreview = async () => {
    if (!projectId || allRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.reports.generateEmailReport(projectId, allRecipients, reportType, 'html');
      setEmailPreview({
        subject: response.data.subject || response.subject,
        body: response.data.body || response.body,
      });
      setShowPreview(true);
      toast.success('Email preview generated');
    } catch (error: any) {
      console.error('Preview error:', error);
      toast.error(`Failed to generate preview: ${error?.response?.data?.message || error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!projectId || allRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.reports.generateEmailReport(projectId, allRecipients, reportType, 'html');
      const emailData = response.data || response;
      
      // Create mailto link
      const subject = encodeURIComponent(emailData.subject);
      const body = encodeURIComponent(emailData.body);
      const recipients = allRecipients.join(',');
      
      const mailtoLink = `mailto:${recipients}?subject=${subject}&body=${body}`;
      window.location.href = mailtoLink;
      
      // Also copy email content to clipboard
      navigator.clipboard.writeText(emailData.body).catch(() => {});
      
      toast.success('Email draft opened in your email client');
      onOpenChange(false);
      
      // Reset form
      setSelectedMemberIds(new Set());
      setExternalEmails('');
      setEmailPreview(null);
      setShowPreview(false);
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error(`Failed to generate email: ${error?.response?.data?.message || error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyEmail = () => {
    if (emailPreview) {
      navigator.clipboard.writeText(emailPreview.body);
      toast.success('Email content copied to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Send Project Report</DialogTitle>
          <DialogDescription>
            Select recipients and send the project report via email
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-6">
            {/* Project Members Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Project Members</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedMemberIds.size === members.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <ScrollArea className="h-48 border rounded-md p-4">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No project members found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member: any) => (
                      <div
                        key={member.userId}
                        className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md"
                      >
                        <Checkbox
                          id={`member-${member.userId}`}
                          checked={selectedMemberIds.has(member.userId)}
                          onCheckedChange={() => handleMemberToggle(member.userId)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Label
                            htmlFor={`member-${member.userId}`}
                            className="cursor-pointer font-medium"
                          >
                            {member.user?.name || 'Unknown'}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {member.user?.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* External Email Input */}
            <div>
              <Label htmlFor="externalEmails">External Email Addresses</Label>
              <Input
                id="externalEmails"
                placeholder="email1@example.com, email2@example.com"
                value={externalEmails}
                onChange={(e) => setExternalEmails(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter comma-separated email addresses for recipients not in the project
              </p>
            </div>

            {/* Recipients Summary */}
            {allRecipients.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-900">
                  {allRecipients.length} recipient{allRecipients.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {allRecipients.join(', ')}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={allRecipients.length === 0 || isGenerating}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSend}
                disabled={allRecipients.length === 0 || isGenerating}
              >
                <Mail className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Send Email'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Email Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div>
                <Label>Subject</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {emailPreview?.subject}
                </div>
              </div>

              <div>
                <Label>Body (HTML)</Label>
                <ScrollArea className="h-96 border rounded-md p-4">
                  <div
                    dangerouslySetInnerHTML={{ __html: emailPreview?.body || '' }}
                    className="prose prose-sm max-w-none"
                  />
                </ScrollArea>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCopyEmail}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Content
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Back
              </Button>
              <Button onClick={handleSend} disabled={isGenerating}>
                <Mail className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Send Email'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportEmailDialog;

