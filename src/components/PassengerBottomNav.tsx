import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Clock, User, Car, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  { 
    icon: Home, 
    label: 'Home', 
    path: '/passenger',
    matchPaths: ['/passenger', '/passenger/book-ride']
  },
  { 
    icon: MapPin, 
    label: 'Rides', 
    path: '/passenger/history',
    matchPaths: ['/passenger/history', '/passenger/ride', '/passenger/rate']
  },
  { 
    icon: Car, 
    label: 'Rentals', 
    path: '/passenger/rentals',
    matchPaths: ['/passenger/rentals', '/cars']
  },
  { 
    icon: User, 
    label: 'Profile', 
    path: '/passenger/profile',
    matchPaths: ['/passenger/profile']
  },
];

const PassengerBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item: NavItem) => {
    if (item.matchPaths) {
      return item.matchPaths.some(p => location.pathname.startsWith(p));
    }
    return location.pathname === item.path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors",
                "touch-manipulation active:scale-95",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mb-1 transition-transform",
                active && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-medium",
                active && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default PassengerBottomNav;
