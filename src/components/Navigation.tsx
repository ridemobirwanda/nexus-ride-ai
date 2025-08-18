import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Car, Menu, X, User, MapPin, Star } from 'lucide-react';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-primary animate-pulse-glow">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-hero bg-clip-text text-transparent">
              RideNext
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-smooth">
              Features
            </a>
            <a href="#safety" className="text-muted-foreground hover:text-foreground transition-smooth">
              Safety
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-smooth">
              Pricing
            </a>
            <Button variant="ghost" className="gap-2" onClick={() => window.location.href = '/passenger/auth'}>
              <User className="h-4 w-4" />
              Passenger Login
            </Button>
            <Button variant="hero" className="gap-2" onClick={() => window.location.href = '/driver/auth'}>
              <Car className="h-4 w-4" />
              Drive with us
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4 border-t border-border pt-4">
            <a href="#features" className="block text-muted-foreground hover:text-foreground transition-smooth">
              Features
            </a>
            <a href="#safety" className="block text-muted-foreground hover:text-foreground transition-smooth">
              Safety
            </a>
            <a href="#pricing" className="block text-muted-foreground hover:text-foreground transition-smooth">
              Pricing
            </a>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="gap-2 justify-start" onClick={() => window.location.href = '/passenger/auth'}>
                <User className="h-4 w-4" />
                Passenger Login
              </Button>
              <Button variant="hero" className="gap-2 justify-start" onClick={() => window.location.href = '/driver/auth'}>
                <Car className="h-4 w-4" />
                Drive with us
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;