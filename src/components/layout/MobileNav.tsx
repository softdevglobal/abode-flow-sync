import { Link, useLocation } from 'react-router-dom';
import { Home, Building2, Calendar, Users, Calculator, FileText, QrCode, Bell, Menu, X, Gavel, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  userRole: 'agent' | 'customer';
}

const agentNavItems = [
  { icon: Home, label: 'Dashboard', path: '/agent' },
  { icon: Building2, label: 'Properties', path: '/agent/properties' },
  { icon: Gavel, label: 'Auctions', path: '/agent/auctions' },
  { icon: Calendar, label: 'Inspections', path: '/agent/inspections' },
  { icon: Users, label: 'Requests', path: '/agent/requests' },
];

const customerNavItems = [
  { icon: Home, label: 'Browse', path: '/browse' },
  { icon: Gavel, label: 'Auctions', path: '/auctions' },
  { icon: Calendar, label: 'Inspections', path: '/inspections' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function MobileNav({ userRole }: MobileNavProps) {
  const location = useLocation();
  const navItems = userRole === 'agent' ? agentNavItems : customerNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
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
  );
}

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  userRole?: 'agent' | 'customer';
}

export function Header({ title = 'Abode', showBack, userRole }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center shadow-glow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">{title}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full animate-pulse" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
