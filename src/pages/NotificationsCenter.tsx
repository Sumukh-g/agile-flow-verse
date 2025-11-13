import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    useArchiveNotifications,
    useCreateNotificationService,
    useDeleteNotification,
    useDeleteNotificationService,
    useMarkAllAsRead,
    useMarkAsRead,
    useNotifications,
    useNotificationServices,
    useRealtimeNotifications,
    useUnarchiveNotifications,
    useUnreadCount,
    useUpdateNotificationService
} from '@/hooks/useNotifications';
import {
    Archive,
    Bell,
    CheckCircle,
    Eye,
    EyeOff,
    Facebook,
    Instagram,
    Loader2,
    Mail,
    MessageCircle,
    MessageSquare,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Slack,
    Trash2
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

const NotificationsCenter: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    category: 'Work' as 'Important' | 'Social' | 'Work'
  });

  // Fetch data from API
  const { 
    data: notificationsData, 
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications,
    error: notificationsError
  } = useNotifications({
    search: searchQuery || undefined,
    priority: selectedPriority !== 'all' ? selectedPriority : undefined,
    limit: 50,
  });

  const { data: unreadCountData } = useUnreadCount();
  
  const { 
    data: services = [], 
    isLoading: isLoadingServices 
  } = useNotificationServices();

  // Enable real-time notification updates
  useRealtimeNotifications(true);

  // Mutations
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const archiveMutation = useArchiveNotifications();
  const unarchiveMutation = useUnarchiveNotifications();
  const deleteNotificationMutation = useDeleteNotification();
  const createServiceMutation = useCreateNotificationService();
  const updateServiceMutation = useUpdateNotificationService();
  const deleteServiceMutation = useDeleteNotificationService();

  // Extract notifications from response
  const allNotifications = notificationsData?.notifications || [];

  // Filter notifications by category on frontend (since backend doesn't support it yet)
  const filteredNotifications = allNotifications.filter(notification => {
    if (selectedCategory !== 'all' && notification.category !== selectedCategory) {
      return false;
    }
    if (showArchived !== notification.archived) {
      return false;
    }
    return true;
  });

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      Mail, MessageCircle, Instagram, Facebook, MessageSquare, Slack
    };
    return iconMap[iconName] || Bell;
  };

  // Handle notification actions
  const markAsRead = (id: string) => {
    markAsReadMutation.mutate([id]);
  };

  const markAsUnread = (id: string) => {
    // Backend doesn't have unmark as read, we'd need to add that
    toast.info('Mark as unread not yet implemented in backend');
  };

  const archiveNotification = (id: string) => {
    archiveMutation.mutate([id]);
  };

  const unarchiveNotification = (id: string) => {
    unarchiveMutation.mutate([id]);
  };

  const deleteNotification = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Handle service management
  const toggleService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      updateServiceMutation.mutate({
        id: serviceId,
        data: { enabled: !service.enabled }
      });
    }
  };

  const addService = () => {
    if (newService.name.trim()) {
      createServiceMutation.mutate({
        name: newService.name,
        category: newService.category,
        icon: 'Bell',
        color: 'bg-gray-500',
      });
      setNewService({ name: '', category: 'Work' });
      setIsAddingService(false);
    }
  };

  const removeService = (serviceId: string) => {
    deleteServiceMutation.mutate(serviceId);
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Important': return 'bg-red-100 text-red-800';
      case 'Social': return 'bg-blue-100 text-blue-800';
      case 'Work': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadCount = unreadCountData?.count || 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications Center</h1>
          <p className="text-gray-600 mt-2">Manage all your notifications in one place</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetchNotifications()}
            disabled={isLoadingNotifications}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingNotifications ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={markAllAsRead} 
            disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
          <Button variant="outline" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showArchived ? 'Hide archived' : 'Show archived'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {notificationsError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="font-medium">Error loading notifications</p>
          <p className="text-sm">{(notificationsError as Error).message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Services Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Connected Services</span>
                <Dialog open={isAddingService} onOpenChange={setIsAddingService}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Service</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="service-name">Service Name</Label>
                        <Input
                          id="service-name"
                          value={newService.name}
                          onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter service name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="service-category">Category</Label>
                        <Select
                          value={newService.category}
                          onValueChange={(value: 'Important' | 'Social' | 'Work') => 
                            setNewService(prev => ({ ...prev, category: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Work">Work</SelectItem>
                            <SelectItem value="Social">Social</SelectItem>
                            <SelectItem value="Important">Important</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingService(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={addService}
                        disabled={createServiceMutation.isPending}
                      >
                        {createServiceMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Service'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingServices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : services.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No services connected yet
                </p>
              ) : (
                services.map(service => (
                  <div key={service.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${service.color} flex items-center justify-center`}>
                        {React.createElement(getIconComponent(service.icon), { className: 'w-4 h-4 text-white' })}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{service.name}</div>
                        <Badge variant="secondary" className="text-xs">
                          {service.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.enabled}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => toast.info('Connecting to service...')}>
                            Connect
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('Service settings opened')}>
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => removeService(service.id)}
                            className="text-red-600"
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Notifications ({filteredNotifications.length})
                  {unreadCount > 0 && (
                    <Badge className="ml-2" variant="destructive">
                      {unreadCount} unread
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Important">Important</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Work">Work</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingNotifications ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500">
                    {showArchived ? "No archived notifications" : "You're all caught up!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                        notification.read ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notification.source ? 'bg-blue-500' : 'bg-gray-500'
                        }`}>
                          <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                              <div className="flex items-center gap-2">
                                {notification.source && (
                                  <Badge variant="outline" className="text-xs">
                                    {notification.source}
                                  </Badge>
                                )}
                                {notification.category && (
                                  <Badge className={`text-xs ${getCategoryColor(notification.category)}`}>
                                    {notification.category}
                                  </Badge>
                                )}
                                <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                  {notification.priority}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(notification.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {notification.read ? (
                                  <DropdownMenuItem onClick={() => markAsUnread(notification.id)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Mark as unread
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark as read
                                  </DropdownMenuItem>
                                )}
                                {notification.archived ? (
                                  <DropdownMenuItem onClick={() => unarchiveNotification(notification.id)}>
                                    <Archive className="w-4 h-4 mr-2" />
                                    Unarchive
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => archiveNotification(notification.id)}>
                                    <Archive className="w-4 h-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationsCenter;
