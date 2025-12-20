import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  Filter,
  TrendingUp
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

type NotificationType = 'all' | 'viewing_request' | 'inspection_reminder' | 'new_listing' | 'status_update' | 'message' | 'appraisal_interest';
type ReadFilter = 'all' | 'unread' | 'read';

export default function AgentNotifications() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<NotificationType>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const markAsRead = useMarkNotificationRead();

  // Navigate to the appropriate page based on notification type and data
  const handleNotificationClick = (notification: any) => {
    // Mark as read first
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }

    const data = notification.data as Record<string, any> | null;
    
    switch (notification.type) {
      case 'viewing_request':
        // Navigate to requests page
        navigate('/agent/requests');
        break;
      case 'appraisal_interest':
        // Navigate to appraisals page
        navigate('/agent/appraisals');
        break;
      case 'inspection_reminder':
        // Navigate to inspections page
        navigate('/agent/inspections');
        break;
      case 'status_update':
        // If it's an auction bid, navigate to auctions
        if (data?.auction_id) {
          navigate('/agent/auctions');
        } else if (data?.property_id) {
          navigate('/agent/properties');
        }
        break;
      case 'new_listing':
        navigate('/agent/properties');
        break;
      case 'message':
        navigate('/agent/requests');
        break;
      default:
        // Stay on notifications page
        break;
    }
  };

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
      case 'appraisal_interest':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
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
      case 'appraisal_interest':
        return 'default';
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
            <h1 className="text-2xl font-bold text-foreground font-display">Notifications</h1>
            <p className="text-muted-foreground font-body">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={handleMarkAllAsRead}
              className="gap-2 font-body hover:border-primary/50"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="w-4 h-4 text-primary" />
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as NotificationType)}>
                  <SelectTrigger className="w-full sm:w-[200px] font-body">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-body">All Types</SelectItem>
                    <SelectItem value="appraisal_interest" className="font-body">Pre-Market Interests</SelectItem>
                    <SelectItem value="viewing_request" className="font-body">Viewing Requests</SelectItem>
                    <SelectItem value="inspection_reminder" className="font-body">Inspection Reminders</SelectItem>
                    <SelectItem value="status_update" className="font-body">Status Updates</SelectItem>
                    <SelectItem value="message" className="font-body">Messages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Tabs value={readFilter} onValueChange={(v) => setReadFilter(v as ReadFilter)} className="w-full sm:w-auto">
                <TabsList className="bg-card/50 border border-border/50">
                  <TabsTrigger value="all" className="font-body data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All</TabsTrigger>
                  <TabsTrigger value="unread" className="font-body data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Unread</TabsTrigger>
                  <TabsTrigger value="read" className="font-body data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Read</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-display">
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground font-body">
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium font-display">No notifications found</p>
                <p className="text-sm font-body">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-4 hover:bg-primary/5 cursor-pointer transition-colors",
                      !notification.read && "bg-primary/10 border-l-2 border-l-primary"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={cn(
                              "text-sm font-body",
                              !notification.read ? "font-semibold text-foreground" : "text-foreground"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 font-body">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                            <Badge variant={getTypeBadgeVariant(notification.type)} className="text-xs font-body">
                              {formatType(notification.type)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-body">
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
