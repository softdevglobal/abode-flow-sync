import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home,
  Search,
  Gavel,
  Calendar,
  Eye,
  Heart,
  Calculator,
  User,
  HelpCircle,
  Phone,
  Bell,
  Menu,
  X,
  Building2,
  ChevronDown,
  FileText,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAgencyTheme } from '@/contexts/AgencyThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Footer } from './Footer';

// Primary nav items for bottom tab bar (5 max)
const primaryNavItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Browse', path: '/browse' },
  { icon: Calendar, label: 'Inspections', path: '/inspections' },
  { icon: Gavel, label: 'Auctions', path: '/auctions' },
  { icon: User, label: 'Profile', path: '/profile' },
];

// All nav items for mobile menu
const allNavItems = [
  { icon: Home, label: 'Home', path: '/', section: 'main' },
  { icon: Search, label: 'Browse Properties', path: '/browse', section: 'main' },
  { icon: Gavel, label: 'Live Auctions', path: '/auctions', section: 'main' },
  { icon: Building2, label: 'Pre-Market', path: '/pre-market', section: 'main' },
  { icon: FileText, label: 'Request Appraisal', path: '/appraisals', section: 'main' },
  { icon: Mail, label: 'Messages', path: '/messages', section: 'track' },
  { icon: Calendar, label: 'My Inspections', path: '/inspections', section: 'track' },
  { icon: Eye, label: 'My Viewings', path: '/viewings', section: 'track' },
  { icon: FileText, label: 'My Appraisal Requests', path: '/my-appraisal-requests', section: 'track' },
  { icon: Heart, label: 'Saved Properties', path: '/saved', section: 'track' },
  { icon: Calculator, label: 'Calculator', path: '/calculator', section: 'tools' },
  { icon: HelpCircle, label: 'How It Works', path: '/how-it-works', section: 'tools' },
  { icon: Phone, label: 'Contact', path: '/contact', section: 'tools' },
  { icon: User, label: 'Profile', path: '/profile', section: 'account' },
];

interface BuyerLayoutProps {
  children: React.ReactNode;
}

export function BuyerLayout({ children }: BuyerLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      if (!user?.id) return { inspections: 0, viewings: 0, messages: 0, total: 0 };
      
      // Fetch notifications
      const { data: notifs, error: notifError } = await supabase
        .from('notifications')
        .select('type')
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (notifError) throw notifError;
      
      // Fetch unread messages count
      const { count: messagesCount, error: msgError } = await supabase
        .from('buyer_messages')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .eq('read', false);
      
      if (msgError) console.error('Messages count error:', msgError);
      
      const inspections = notifs?.filter(n => 
        n.type === 'inspection_reminder' || n.type === 'status_update'
      ).length || 0;
      
      const viewings = notifs?.filter(n => 
        n.type === 'viewing_request'
      ).length || 0;
      
      return { 
        inspections, 
        viewings, 
        messages: messagesCount || 0,
        total: (notifs?.length || 0) + (messagesCount || 0)
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

  // Handle notification click - navigate to appropriate page
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
          console.log('Notification change detected, refetching...');
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
  };

  // Get badge count for a specific path
  const getBadgeCount = (path: string) => {
    if (path === '/inspections') return notificationCounts?.inspections || 0;
    if (path === '/viewings') return notificationCounts?.viewings || 0;
    if (path === '/messages') return notificationCounts?.messages || 0;
    return 0;
  };

  const NavSection = ({ title, items }: { title: string; items: typeof allNavItems }) => (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-4">{title}</p>
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        const badgeCount = getBadgeCount(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {badgeCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold bg-accent text-accent-foreground rounded-full">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.agencyName} className="h-8 w-auto" />
            ) : (
              <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center shadow-glow-sm">
                <Building2 className="w-5 h-5 text-accent-foreground" />
              </div>
            )}
            <span className="font-display text-lg font-bold text-foreground hidden sm:block">
              {config.agencyName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {allNavItems.filter(item => item.section === 'main').map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-accent text-accent-foreground shadow-glow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                  <Bell className="w-5 h-5" />
                  {(notificationCounts?.total || 0) > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-card border-border">
                <div className="px-3 py-2 border-b border-border">
                  <p className="font-semibold text-sm">Notifications</p>
                  {(notificationCounts?.total || 0) > 0 && (
                    <p className="text-xs text-muted-foreground">{notificationCounts?.total} unread</p>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 8).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "flex flex-col items-start gap-1 p-3 cursor-pointer",
                        !notification.read && "bg-accent/10"
                      )}
                    >
                      <div className="flex items-start gap-2 w-full">
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm truncate",
                            !notification.read ? "font-semibold" : "font-medium"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile/Auth - Desktop */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden md:flex items-center gap-2 px-2 rounded-full">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-accent/20 text-accent text-sm font-bold">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold text-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile">
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/inspections">
                      <Calendar className="w-4 h-4 mr-2" />
                      My Inspections
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/viewings">
                      <Eye className="w-4 h-4 mr-2" />
                      My Viewings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm" className="hidden md:flex">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-card p-4 max-h-[calc(100vh-56px)] overflow-y-auto">
            <NavSection 
              title="Explore" 
              items={allNavItems.filter(item => item.section === 'main')} 
            />
            <NavSection 
              title="My Activity" 
              items={allNavItems.filter(item => item.section === 'track')} 
            />
            <NavSection 
              title="Tools & Help" 
              items={allNavItems.filter(item => item.section === 'tools')} 
            />
            
            {/* Auth section */}
            <div className="mt-4 pt-4 border-t border-border">
              {user ? (
                <>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-4">Account</p>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <User className="w-5 h-5" />
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-accent text-accent-foreground"
                >
                  Sign In / Register
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">{children}</main>

      {/* Footer - Desktop only */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Bottom Tab Bar - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg md:hidden">
        <div className="flex items-center justify-around py-2">
          {primaryNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const badgeCount = getBadgeCount(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 relative",
                  isActive 
                    ? "text-accent scale-105" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_hsl(24,95%,53%,0.5)]")} />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold bg-accent text-accent-foreground rounded-full">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium font-body">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
