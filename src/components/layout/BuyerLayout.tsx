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
import { useState } from 'react';
import { useAgencyTheme } from '@/contexts/AgencyThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/useAuth';

// Primary nav items for bottom tab bar (5 max)
const primaryNavItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Browse', path: '/browse' },
  { icon: Gavel, label: 'Auctions', path: '/auctions' },
  { icon: Heart, label: 'Saved', path: '/saved' },
  { icon: User, label: 'Profile', path: '/profile' },
];

// All nav items for mobile menu
const allNavItems = [
  { icon: Home, label: 'Home', path: '/', section: 'main' },
  { icon: Search, label: 'Browse Properties', path: '/browse', section: 'main' },
  { icon: Gavel, label: 'Live Auctions', path: '/auctions', section: 'main' },
  { icon: FileText, label: 'Appraisals', path: '/appraisals', section: 'main' },
  { icon: Calendar, label: 'My Inspections', path: '/inspections', section: 'track' },
  { icon: Eye, label: 'My Viewings', path: '/viewings', section: 'track' },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const config = useAgencyTheme();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const NavSection = ({ title, items }: { title: string; items: typeof allNavItems }) => (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-4">{title}</p>
      {items.map((item) => {
        const isActive = location.pathname === item.path;
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
            {item.label}
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

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
            </Button>

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

      {/* Bottom Tab Bar - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg md:hidden">
        <div className="flex items-center justify-around py-2">
          {primaryNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive 
                    ? "text-accent scale-105" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_hsl(24,95%,53%,0.5)]")} />
                <span className="text-[10px] font-medium font-body">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
