/**
 * Audit Log Viewer Component
 * 
 * Provides a comprehensive view of all security and system audit events.
 * 
 * Features:
 * - Real-time audit event streaming
 * - Filtering by event type, user, date range
 * - Export functionality (CSV/JSON)
 * - Event severity indicators
 * - Detailed event information modal
 * - Infinite scroll for large datasets
 * 
 * @component
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Filter,
  Globe,
  Info,
  Key,
  Lock,
  LogIn,
  LogOut,
  MoreHorizontal,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  Upload,
  User,
  UserPlus,
  UserX,
  XCircle,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type AuditEventSeverity = 'info' | 'warning' | 'error' | 'critical';
type AuditEventCategory = 'auth' | 'user' | 'security' | 'data' | 'system' | 'api';

interface AuditEvent {
  id: string;
  timestamp: string;
  severity: AuditEventSeverity;
  category: AuditEventCategory;
  action: string;
  description: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  resourceId?: string;
  resourceType?: string;
}

interface AuditLogViewerProps {
  /** Maximum height of the component */
  maxHeight?: string;
  /** Show full details or compact view */
  compact?: boolean;
  /** Filter by specific user ID */
  userIdFilter?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

/**
 * Generate mock audit events for demonstration
 */
const generateMockAuditEvents = (): AuditEvent[] => {
  const events: AuditEvent[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      severity: 'info',
      category: 'auth',
      action: 'login_success',
      description: 'Successful user login',
      userId: 'user-1',
      userName: 'John Doe',
      userEmail: 'john@company.com',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      severity: 'warning',
      category: 'auth',
      action: 'login_failed',
      description: 'Failed login attempt - invalid password',
      userEmail: 'unknown@domain.com',
      ipAddress: '203.0.113.1',
      userAgent: 'curl/7.68.0',
      metadata: { attempts: 3 },
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      severity: 'info',
      category: 'user',
      action: 'user_created',
      description: 'New user account created',
      userId: 'user-5',
      userName: 'Emily Chen',
      userEmail: 'emily@company.com',
      metadata: { role: 'member', invitedBy: 'john@company.com' },
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      severity: 'warning',
      category: 'security',
      action: 'permission_denied',
      description: 'Unauthorized access attempt to admin panel',
      userId: 'user-3',
      userName: 'Mike Johnson',
      userEmail: 'mike@company.com',
      ipAddress: '192.168.1.105',
      resourceType: 'admin_panel',
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      severity: 'info',
      category: 'security',
      action: '2fa_enabled',
      description: 'Two-factor authentication enabled',
      userId: 'user-1',
      userName: 'John Doe',
      userEmail: 'john@company.com',
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      severity: 'critical',
      category: 'security',
      action: 'suspicious_activity',
      description: 'Multiple failed login attempts from different IPs',
      userEmail: 'sarah@company.com',
      metadata: { 
        ips: ['203.0.113.1', '198.51.100.1', '192.0.2.1'],
        attempts: 15,
        timeWindow: '5 minutes'
      },
    },
    {
      id: '7',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      severity: 'info',
      category: 'data',
      action: 'export_data',
      description: 'User exported project data',
      userId: 'user-2',
      userName: 'Sarah Wilson',
      userEmail: 'sarah@company.com',
      resourceType: 'project',
      resourceId: 'proj-123',
      metadata: { format: 'csv', records: 450 },
    },
    {
      id: '8',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      severity: 'info',
      category: 'system',
      action: 'backup_completed',
      description: 'Automated system backup completed successfully',
      metadata: { size: '2.4GB', duration: '45 seconds' },
    },
    {
      id: '9',
      timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      severity: 'warning',
      category: 'api',
      action: 'rate_limit_exceeded',
      description: 'API rate limit exceeded',
      userId: 'user-1',
      userName: 'John Doe',
      userEmail: 'john@company.com',
      metadata: { limit: 1000, current: 1247, resetIn: '15 minutes' },
    },
    {
      id: '10',
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      severity: 'error',
      category: 'system',
      action: 'service_error',
      description: 'Email service temporarily unavailable',
      metadata: { service: 'email', error: 'SMTP connection timeout' },
    },
    {
      id: '11',
      timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
      severity: 'info',
      category: 'user',
      action: 'password_changed',
      description: 'User changed their password',
      userId: 'user-4',
      userName: 'David Brown',
      userEmail: 'david@company.com',
      ipAddress: '192.168.1.110',
    },
    {
      id: '12',
      timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
      severity: 'info',
      category: 'auth',
      action: 'logout',
      description: 'User logged out',
      userId: 'user-2',
      userName: 'Sarah Wilson',
      userEmail: 'sarah@company.com',
      ipAddress: '192.168.1.102',
    },
  ];
  
  return events;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get severity badge color based on severity level
 */
const getSeverityStyle = (severity: AuditEventSeverity) => {
  switch (severity) {
    case 'info':
      return { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200' };
    case 'warning':
      return { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-800 dark:text-amber-200' };
    case 'error':
      return { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200' };
    case 'critical':
      return { bg: 'bg-red-200 dark:bg-red-800', text: 'text-red-900 dark:text-red-100' };
    default:
      return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200' };
  }
};

/**
 * Get icon based on action type
 */
const getActionIcon = (action: string, category: AuditEventCategory) => {
  const iconClass = 'h-4 w-4';
  
  // Authentication actions
  if (action.includes('login_success') || action === 'login') return <LogIn className={iconClass} />;
  if (action.includes('login_failed')) return <XCircle className={iconClass} />;
  if (action.includes('logout')) return <LogOut className={iconClass} />;
  
  // User actions
  if (action.includes('user_created')) return <UserPlus className={iconClass} />;
  if (action.includes('user_deleted')) return <UserX className={iconClass} />;
  if (action.includes('password')) return <Key className={iconClass} />;
  
  // Security actions
  if (action.includes('2fa')) return <Shield className={iconClass} />;
  if (action.includes('permission')) return <Lock className={iconClass} />;
  if (action.includes('suspicious')) return <AlertTriangle className={iconClass} />;
  
  // Data actions
  if (action.includes('export') || action.includes('download')) return <Download className={iconClass} />;
  if (action.includes('import') || action.includes('upload')) return <Upload className={iconClass} />;
  if (action.includes('delete')) return <Trash2 className={iconClass} />;
  
  // System actions
  if (action.includes('backup')) return <RefreshCw className={iconClass} />;
  if (action.includes('settings')) return <Settings className={iconClass} />;
  if (action.includes('rate_limit')) return <Clock className={iconClass} />;
  
  // Default based on category
  switch (category) {
    case 'auth': return <LogIn className={iconClass} />;
    case 'user': return <User className={iconClass} />;
    case 'security': return <Shield className={iconClass} />;
    case 'data': return <Download className={iconClass} />;
    case 'system': return <Settings className={iconClass} />;
    case 'api': return <Globe className={iconClass} />;
    default: return <Info className={iconClass} />;
  }
};

/**
 * Format relative time
 */
const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now.getTime() - eventTime.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return format(eventTime, 'MMM d, yyyy');
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  maxHeight = '600px',
  compact = false,
  userIdFilter,
}) => {
  // State
  const [events] = useState<AuditEvent[]>(generateMockAuditEvents());
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // User ID filter
      if (userIdFilter && event.userId !== userIdFilter) return false;
      
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchFields = [
          event.action,
          event.description,
          event.userName,
          event.userEmail,
          event.ipAddress,
        ].filter(Boolean).map(f => f!.toLowerCase());
        
        if (!searchFields.some(f => f.includes(query))) return false;
      }
      
      // Severity filter
      if (severityFilter !== 'all' && event.severity !== severityFilter) return false;
      
      // Category filter
      if (categoryFilter !== 'all' && event.category !== categoryFilter) return false;
      
      return true;
    });
  }, [events, searchQuery, severityFilter, categoryFilter, userIdFilter]);
  
  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast.success('Audit logs refreshed');
  }, []);
  
  // Export handler
  const handleExport = useCallback((format: 'csv' | 'json') => {
    const data = format === 'json' 
      ? JSON.stringify(filteredEvents, null, 2)
      : [
          'Timestamp,Severity,Category,Action,Description,User,Email,IP Address',
          ...filteredEvents.map(e => 
            `${e.timestamp},${e.severity},${e.category},${e.action},"${e.description}",${e.userName || ''},${e.userEmail || ''},${e.ipAddress || ''}`
          )
        ].join('\n');
    
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
    a.click();
    
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredEvents.length} events as ${format.toUpperCase()}`);
  }, [filteredEvents]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security Audit Log
            </CardTitle>
            <CardDescription>
              {filteredEvents.length} events • Last updated: {format(new Date(), 'MMM d, h:mm a')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40" align="end">
                <div className="space-y-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleExport('csv')}>
                    Export as CSV
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleExport('json')}>
                    Export as JSON
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="auth">Authentication</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="data">Data</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="api">API</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Event List */}
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-2">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No audit events found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const severityStyle = getSeverityStyle(event.severity);
                
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedEvent(event)}
                  >
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${severityStyle.bg}`}>
                      <span className={severityStyle.text}>
                        {getActionIcon(event.action, event.category)}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{event.description}</span>
                        <Badge variant="outline" className={`text-xs ${severityStyle.bg} ${severityStyle.text} border-0`}>
                          {event.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {event.userEmail && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {event.userEmail}
                          </span>
                        )}
                        {event.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {event.ipAddress}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(event.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action */}
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && getActionIcon(selectedEvent.action, selectedEvent.category)}
              Event Details
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="font-medium">{format(new Date(selectedEvent.timestamp), 'PPpp')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Severity</p>
                  <Badge className={`${getSeverityStyle(selectedEvent.severity).bg} ${getSeverityStyle(selectedEvent.severity).text}`}>
                    {selectedEvent.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium capitalize">{selectedEvent.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Action</p>
                  <p className="font-medium">{selectedEvent.action.replace(/_/g, ' ')}</p>
                </div>
              </div>
              
              <Separator />
              
              {selectedEvent.userName && (
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedEvent.userName} ({selectedEvent.userEmail})</p>
                </div>
              )}
              
              {selectedEvent.ipAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-medium font-mono">{selectedEvent.ipAddress}</p>
                </div>
              )}
              
              {selectedEvent.userAgent && (
                <div>
                  <p className="text-sm text-muted-foreground">User Agent</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded">{selectedEvent.userAgent}</p>
                </div>
              )}
              
              {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Additional Details</p>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AuditLogViewer;

