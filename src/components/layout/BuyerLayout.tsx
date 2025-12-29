import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home,
  Search,
  Gavel,
  Calendar,
  User,
  Bell,
  Menu,
  X,
  Building2,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAgencyTheme } from '@/contexts/AgencyThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

// Primary nav items for bottom tab bar (5 max)
const primaryNavItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Browse', path: '/browse' },
  { icon: Calendar, label: 'Inspections', path: '/inspections' },
  { icon: Gavel, label: 'Auctions', path: '/auctions' },
  { icon: MoreHorizontal, label: 'More', path: 'more' },
];

// More menu items
const moreMenuItems = [
  { label: 'My Viewings', path: '/viewings' },
  { label: 'My Profile', path: '/profile' },
  { label: 'Pre-Market', path: '/pre-market' },
  { label: 'Request Appraisal', path: '/appraisals' },
  { label: 'My Appraisal Requests', path: '/my-appraisal-requests' },
  { label: 'Messages', path: '/messages' },
  { label: 'Saved Properties', path: '/saved' },
  { label: 'Calculator', path: '/calculator' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Contact', path: '/contact' },
];

interface BuyerLayoutProps {
  children: React.ReactNode;
}

export function BuyerLayout({ children }: BuyerLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const config = useAgencyTheme();
  const { user, signOut } = useAuth();

  // Fetch notifications for user
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['buyer-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch unread notification counts
  const { data: notificationCounts } = useQuery({
    queryKey: ['buyer-notification-counts', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0 };
      
      const { data: notifs, error: notifError } = await supabase
        .from('notifications')
        .select('type')
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (notifError) throw notifError;
      
      return { 
        total: notifs?.length || 0
      };
    },
    enabled: !!user?.id,
  });

  // Mark notification as read mutation
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-notification-counts'] });
    },
  });

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }

    const data = notification.data as Record<string, any> | null;
    
    switch (notification.type) {
      case 'viewing_request':
        navigate('/viewings');
        break;
      case 'inspection_reminder':
        navigate('/inspections');
        break;
      case 'appraisal_interest':
        navigate('/pre-market');
        break;
      case 'status_update':
        if (data?.property_id) {
          navigate(`/property/${data.property_id}`);
        }
        break;
      case 'new_listing':
        if (data?.property_id) {
          navigate(`/property/${data.property_id}`);
        } else {
          navigate('/browse');
        }
        break;
      default:
        break;
    }
  };

  // Real-time subscription for notification updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('buyer-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refetchNotifications();
          queryClient.invalidateQueries({ queryKey: ['buyer-notification-counts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetchNotifications, queryClient]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMoreMenuOpen(false);
  };

  const isActiveTab = (path: string) => {
    if (path === 'more') {
      return moreMenuItems.some(item => location.pathname === item.path);
    }
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact Mobile Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-12 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.agencyName} className="h-7 w-auto" />
            ) : (
              <div className="w-7 h-7 rounded-lg gradient-orange flex items-center justify-center">
                <Building2 className="w-4 h-4 text-accent-foreground" />
              </div>
            )}
            <span className="font-display text-base font-bold text-foreground">
              {config.agencyName}
            </span>
          </Link>

          {/* Right Side - Notifications */}
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="w-5 h-5" />
                  {(notificationCounts?.total || 0) > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto bg-card border-border">
                <div className="px-3 py-2 border-b border-border">
                  <p className="font-semibold text-sm">Notifications</p>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "flex flex-col items-start gap-1 p-3 cursor-pointer",
                        !notification.read && "bg-accent/10"
                      )}
                    >
                      <p className={cn(
                        "text-sm",
                        !notification.read ? "font-semibold" : "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {notification.message}
                      </p>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-pb">
        <div className="flex items-center justify-around h-14">
          {primaryNavItems.map((item) => {
            const isActive = isActiveTab(item.path);
            
            if (item.path === 'more') {
              return (
                <button
                  key={item.path}
                  onClick={() => setMoreMenuOpen(true)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                    isActive ? "text-accent" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More Menu Sheet */}
      <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="font-display">More</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full pb-8">
            <div className="space-y-1">
              {moreMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Auth section */}
              <div className="pt-4 mt-4 border-t border-border">
                {user ? (
                  <>
                    <p className="text-xs text-muted-foreground px-4 mb-2">
                      Signed in as {user.email}
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMoreMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-accent hover:bg-accent/10 w-full"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
