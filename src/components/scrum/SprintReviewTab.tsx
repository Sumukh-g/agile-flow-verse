import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, MessageSquare, Plus, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useSprintReview, useCreateSprintReview, useUpdateSprintReview, DemonstratedItem } from '@/hooks/useSprintReview';
import type { Sprint } from '@/hooks/useSprints';

interface SprintReviewTabProps {
  sprint: Sprint;
}

export function SprintReviewTab({ sprint }: SprintReviewTabProps) {
  const { data: review, isLoading } = useSprintReview(sprint.id);
  const createReview = useCreateSprintReview();
  const updateReview = useUpdateSprintReview();

  const [showForm, setShowForm] = useState(false);
  const [stakeholderNotes, setStakeholderNotes] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeRole, setAttendeeRole] = useState('');
  const [attendees, setAttendees] = useState<{ userId: string; name: string; role: string }[]>([]);

  const cards = sprint.kanbanCards || [];
  const doneCards = cards.filter((c: any) => c.status === 'done');
  const [demoItems, setDemoItems] = useState<DemonstratedItem[]>(
    doneCards.map((c: any) => ({ cardId: c.id, title: c.title, accepted: true, feedback: '' }))
  );

  const addAttendee = () => {
    if (!attendeeName.trim()) return;
    setAttendees([...attendees, { userId: crypto.randomUUID(), name: attendeeName, role: attendeeRole || 'Stakeholder' }]);
    setAttendeeName('');
    setAttendeeRole('');
  };

  const toggleAccepted = (cardId: string) => {
    setDemoItems(demoItems.map(i => i.cardId === cardId ? { ...i, accepted: !i.accepted } : i));
  };

  const setFeedback = (cardId: string, feedback: string) => {
    setDemoItems(demoItems.map(i => i.cardId === cardId ? { ...i, feedback } : i));
  };

  const handleCreate = () => {
    createReview.mutate({
      sprintId: sprint.id,
      attendees,
      demonstratedItems: demoItems,
      stakeholderNotes,
      reviewDate: new Date().toISOString(),
    });
    setShowForm(false);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading review...</div>;

  if (review) {
    const items = review.demonstratedItems as DemonstratedItem[];
    const accepted = items.filter(i => i.accepted).length;
    const rejected = items.filter(i => !i.accepted).length;
    const reviewAttendees = review.attendees as { name: string; role: string }[];

    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-600">{accepted}</div>
              <div className="text-xs text-muted-foreground">Accepted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-red-600">{rejected}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{reviewAttendees.length}</div>
              <div className="text-xs text-muted-foreground">Attendees</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Attendees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {reviewAttendees.map((a, i) => (
                <Badge key={i} variant="outline">{a.name} ({a.role})</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Demonstrated Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded border">
                {item.accepted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.title}</div>
                  {item.feedback && (
                    <div className="text-xs text-muted-foreground mt-1">{item.feedback}</div>
                  )}
                </div>
                <Badge variant={item.accepted ? 'default' : 'destructive'} className="text-xs">
                  {item.accepted ? 'Accepted' : 'Rejected'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {review.stakeholderNotes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Stakeholder Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{review.stakeholderNotes}</p>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground text-right">
          Review conducted on {format(new Date(review.reviewDate), 'MMM d, yyyy')}
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Users className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">No Sprint Review Yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Conduct a sprint review to demo completed work to stakeholders and capture their feedback.
        </p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> Start Sprint Review
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Attendees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {attendees.map((a, i) => (
              <Badge key={i} variant="outline">{a.name} ({a.role})</Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Name" value={attendeeName} onChange={e => setAttendeeName(e.target.value)} className="h-8" />
            <Input placeholder="Role" value={attendeeRole} onChange={e => setAttendeeRole(e.target.value)} className="h-8 w-32" />
            <Button size="sm" onClick={addAttendee}>Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Demonstrated Items ({doneCards.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {demoItems.map(item => (
            <div key={item.cardId} className="p-2 rounded border space-y-2">
              <div className="flex items-center gap-2">
                <button onClick={() => toggleAccepted(item.cardId)}>
                  {item.accepted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </button>
                <span className="text-sm font-medium flex-1">{item.title}</span>
                <Badge variant={item.accepted ? 'default' : 'destructive'} className="text-xs">
                  {item.accepted ? 'Accepted' : 'Rejected'}
                </Badge>
              </div>
              <Input
                placeholder="Stakeholder feedback..."
                value={item.feedback || ''}
                onChange={e => setFeedback(item.cardId, e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Textarea
        placeholder="General stakeholder notes..."
        value={stakeholderNotes}
        onChange={e => setStakeholderNotes(e.target.value)}
        rows={3}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
        <Button onClick={handleCreate} disabled={createReview.isPending}>
          Save Sprint Review
        </Button>
      </div>
    </div>
  );
}
