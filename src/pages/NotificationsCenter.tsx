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
    Archive,
    Bell,
    CheckCircle,
    Eye,
    EyeOff,
    Facebook,
    Instagram,
    Mail,
    MessageCircle,
    MessageSquare,
    MoreHorizontal,
    Plus,
    Search,
    Slack,
    Trash2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Types
interface Notification {
  id: string;
  title: string;
  message: string;
  source: string;
  category: 'Important' | 'Social' | 'Work';
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  read: boolean;
  archived: boolean;
  icon: string;
  color: string;
  actionUrl?: string;
}

interface Service {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
  connected: boolean;
  category: 'Important' | 'Social' | 'Work';
}

const NotificationsCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    category: 'Work' as 'Important' | 'Social' | 'Work'
  });

  // Initialize with sample data
  useEffect(() => {
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        title: 'New email from John Doe',
        message: 'Project update meeting scheduled for tomorrow at 10 AM',
        source: 'Gmail',
        category: 'Work',
        priority: 'high',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        archived: false,
        icon: 'Mail',
        color: 'bg-blue-500'
      },
      {
        id: '2',
        title: 'WhatsApp message from Sarah',
        message: 'Hey! Are you free for lunch today?',
        source: 'WhatsApp',
        category: 'Social',
        priority: 'medium',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        archived: false,
        icon: 'MessageCircle',
        color: 'bg-green-500'
      },
      {
        id: '3',
        title: 'Slack notification',
        message: 'New message in #general channel',
        source: 'Slack',
        category: 'Work',
        priority: 'low',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true,
        archived: false,
        icon: 'Slack',
        color: 'bg-purple-500'
      },
      {
        id: '4',
        title: 'Instagram like',
        message: 'Sarah liked your photo',
        source: 'Instagram',
        category: 'Social',
        priority: 'low',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
        archived: false,
        icon: 'Instagram',
        color: 'bg-pink-500'
      },
      {
        id: '5',
        title: 'Facebook notification',
        message: 'You have 3 new friend requests',
        source: 'Facebook',
        category: 'Social',
        priority: 'medium',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: false,
        archived: false,
        icon: 'Facebook',
        color: 'bg-blue-600'
      },
      {
        id: '6',
        title: 'Teams meeting reminder',
        message: 'Weekly standup in 15 minutes',
        source: 'Teams',
        category: 'Important',
        priority: 'high',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        read: false,
        archived: false,
        icon: 'MessageSquare',
        color: 'bg-indigo-500'
      }
    ];

    const sampleServices: Service[] = [
      { id: 'gmail', name: 'Gmail', icon: 'Mail', color: 'bg-blue-500', enabled: true, connected: true, category: 'Work' },
      { id: 'whatsapp', name: 'WhatsApp', icon: 'MessageCircle', color: 'bg-green-500', enabled: true, connected: true, category: 'Social' },
      { id: 'slack', name: 'Slack', icon: 'Slack', color: 'bg-purple-500', enabled: true, connected: true, category: 'Work' },
      { id: 'instagram', name: 'Instagram', icon: 'Instagram', color: 'bg-pink-500', enabled: true, connected: true, category: 'Social' },
      { id: 'facebook', name: 'Facebook', icon: 'Facebook', color: 'bg-blue-600', enabled: false, connected: false, category: 'Social' },
      { id: 'teams', name: 'Teams', icon: 'MessageSquare', color: 'bg-indigo-500', enabled: true, connected: true, category: 'Important' }
    ];

    setNotifications(sampleNotifications);
    setServices(sampleServices);
  }, []);

  // Filter notifications based on current filters
  const filteredNotifications = notifications.filter(notification => {
    const matchesCategory = selectedCategory === 'all' || notification.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || notification.priority === selectedPriority;
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchived = showArchived ? true : !notification.archived;

    return matchesCategory && matchesPriority && matchesSearch && matchesArchived;
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
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    toast.success('Marked as read');
  };

  const markAsUnread = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: false } : notification
      )
    );
    toast.success('Marked as unread');
  };

  const archiveNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, archived: true } : notification
      )
    );
    toast.success('Notification archived');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    toast.success('Notification deleted');
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    toast.success('All notifications marked as read');
  };

  // Handle service management
  const toggleService = (serviceId: string) => {
    setServices(prev => 
      prev.map(service => 
        service.id === serviceId ? { ...service, enabled: !service.enabled } : service
      )
    );
    toast.success('Service toggled');
  };

  const addService = () => {
    if (newService.name.trim()) {
      const service: Service = {
        id: newService.name.toLowerCase().replace(/\s+/g, '-'),
        name: newService.name,
        icon: 'Bell',
        color: 'bg-gray-500',
        enabled: true,
        connected: false,
        category: newService.category
      };
      setServices(prev => [...prev, service]);
      setNewService({ name: '', category: 'Work' });
      setIsAddingService(false);
      toast.success('Service added');
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
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

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications Center</h1>
          <p className="text-gray-600 mt-2">Manage all your notifications in one place</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
          <Button variant="outline" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showArchived ? 'Hide archived' : 'Show archived'}
          </Button>
        </div>
      </div>

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
                      <Button onClick={addService}>Add Service</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.map(service => (
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
                          onClick={() => {
                            setServices(prev => prev.filter(s => s.id !== service.id));
                            toast.success('Service removed');
                          }}
                          className="text-red-600"
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
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
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500">You're all caught up!</p>
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
                        <div className={`w-10 h-10 rounded-full ${notification.color} flex items-center justify-center flex-shrink-0`}>
                          {React.createElement(getIconComponent(notification.icon), { className: 'w-5 h-5 text-white' })}
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
                                <Badge variant="outline" className="text-xs">
                                  {notification.source}
                                </Badge>
                                <Badge className={`text-xs ${getCategoryColor(notification.category)}`}>
                                  {notification.category}
                                </Badge>
                                <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                  {notification.priority}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                <DropdownMenuItem onClick={() => archiveNotification(notification.id)}>
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
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