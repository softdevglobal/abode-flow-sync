import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Eye,
  CheckCheck,
  Filter
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMarkNotificationRead } from '@/hooks/useAgentDashboard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DEMO_AGENT_ID = 'da39b948-790b-4a66-94b4-394445a98062';

type NotificationType = 'all' | 'viewing_request' | 'inspection_reminder' | 'new_listing' | 'status_update' | 'message';
type ReadFilter = 'all' | 'unread' | 'read';

export default function AgentNotifications() {
  const [typeFilter, setTypeFilter] = useState<NotificationType>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const markAsRead = useMarkNotificationRead();

  // Get agent's user_id
  const { data: agentData } = useQuery({
    queryKey: ['notifications-agent-user'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('user_id')
        .eq('id', DEMO_AGENT_ID)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const userId = agentData?.user_id;

  // Fetch all notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['all-notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Mark all as read mutation
  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    for (const id of unreadIds) {
      markAsRead.mutate(id);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesRead = readFilter === 'all' || 
      (readFilter === 'unread' && !notification.read) ||
      (readFilter === 'read' && notification.read);
    return matchesType && matchesRead;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'viewing_request':
        return <Eye className="w-5 h-5 text-primary" />;
      case 'inspection_reminder':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'new_listing':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'status_update':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'message':
        return <Info className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'viewing_request':
        return 'default';
      case 'inspection_reminder':
        return 'secondary';
      case 'new_listing':
        return 'outline';
      case 'status_update':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <AgentLayout>
      <div className="container py-6 px-4 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={handleMarkAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as NotificationType)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="viewing_request">Viewing Requests</SelectItem>
                    <SelectItem value="inspection_reminder">Inspection Reminders</SelectItem>
                    <SelectItem value="status_update">Status Updates</SelectItem>
                    <SelectItem value="message">Messages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Tabs value={readFilter} onValueChange={(v) => setReadFilter(v as ReadFilter)} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="read">Read</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No notifications found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.read && markAsRead.mutate(notification.id)}
                    className={cn(
                      "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={cn(
                              "text-sm",
                              !notification.read ? "font-semibold text-foreground" : "text-foreground"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                            <Badge variant={getTypeBadgeVariant(notification.type)} className="text-xs">
                              {formatType(notification.type)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          <span className="mx-2">•</span>
                          {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
}
