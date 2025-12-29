import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Bell,
  Home,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  Settings,
  Handshake,
  Gavel,
  MoreHorizontal,
  CalendarDays,
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
import { useState } from 'react';
import { useAgencyTheme } from '@/contexts/AgencyThemeContext';
import { useAgentNotifications, useMarkNotificationRead } from '@/hooks/useAgentDashboard';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

// Primary nav items for bottom tab bar
const primaryNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/agent' },
  { icon: Building2, label: 'Listings', path: '/agent/properties' },
  { icon: Calendar, label: 'Inspections', path: '/agent/inspections' },
  { icon: Users, label: 'Requests', path: '/agent/requests' },
  { icon: MoreHorizontal, label: 'More', path: 'more' },
];

// More menu items
const moreMenuItems = [
  { icon: CalendarDays, label: 'Diary', path: '/agent/diary' },
  { icon: Gavel, label: 'Auctions', path: '/agent/auctions' },
  { icon: Users, label: 'CRM', path: '/agent/crm' },
  { icon: Handshake, label: 'Network', path: '/agent/network' },
  { icon: FileText, label: 'Appraisals', path: '/agent/appraisals' },
  { icon: Bell, label: 'Notifications', path: '/agent/notifications' },
  { icon: Settings, label: 'Settings', path: '/agent/settings' },
];

interface AgentLayoutProps {
  children: React.ReactNode;
}

export function AgentLayout({ children }: AgentLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const config = useAgencyTheme();
  const { data: notifications = [], isLoading: notificationsLoading } = useAgentNotifications(10);
  const markAsRead = useMarkNotificationRead();
  
  // Get agent user ID for sound notifications
  const agentUserId = notifications[0]?.user_id;
  useNotificationSound(agentUserId);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    
    const data = notification.data as Record<string, any> | null;
    let targetPath = '/agent/notifications';
    
    switch (notification.type) {
      case 'viewing_request':
        targetPath = '/agent/requests';
        break;
      case 'appraisal_interest':
        targetPath = '/agent/requests';
        break;
      case 'inspection_reminder':
        targetPath = '/agent/inspections';
        break;
      case 'status_update':
        if (data?.auction_id) {
          targetPath = '/agent/auctions';
        } else if (data?.property_id) {
          targetPath = '/agent/properties';
        }
        break;
      case 'new_listing':
        targetPath = '/agent/properties';
        break;
      case 'message':
        targetPath = '/agent/requests';
        break;
    }
    
    navigate(targetPath);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inspection_reminder':
        return <Calendar className="w-4 h-4 text-accent" />;
      case 'booking_confirmed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'booking_cancelled':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'appraisal_interest':
        return <Home className="w-4 h-4 text-green-500" />;
      case 'viewing_request':
        return <Users className="w-4 h-4 text-primary" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleGoHome = () => {
    navigate('/');
    setMoreMenuOpen(false);
  };

  const isActiveTab = (path: string) => {
    if (path === 'more') {
      return moreMenuItems.some(item => location.pathname === item.path);
    }
    if (path === '/agent') return location.pathname === '/agent';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact Mobile Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-12 px-4">
          {/* Logo */}
          <Link to="/agent" className="flex items-center gap-2">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.agencyName} className="h-7 w-auto" />
            ) : (
              <div className="w-7 h-7 rounded-lg gradient-orange flex items-center justify-center">
                <Building2 className="w-4 h-4 text-accent-foreground" />
              </div>
            )}
            <span className="font-display text-base font-bold text-foreground">
              Agent
            </span>
          </Link>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto bg-card border-border">
              <div className="px-3 py-2 border-b border-border">
                <p className="font-semibold text-sm">Notifications</p>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                )}
              </div>
              {notificationsLoading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No notifications
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex items-start gap-2 p-3 cursor-pointer",
                      !notification.read && "bg-accent/5"
                    )}
                  >
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm line-clamp-1",
                        !notification.read ? "font-semibold" : "text-muted-foreground"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
        <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
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
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Go to Buyer App */}
              <div className="pt-4 mt-4 border-t border-border">
                <button
                  onClick={handleGoHome}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full"
                >
                  <Home className="w-5 h-5" />
                  Back to Home
                </button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
