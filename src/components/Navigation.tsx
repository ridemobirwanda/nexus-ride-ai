import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Car, Menu, X, User, MapPin, Star } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
            <button 
              onClick={() => navigate('#features')} 
              className="text-muted-foreground hover:text-foreground transition-smooth"
            >
              {t('nav.features')}
            </button>
            <button 
              onClick={() => navigate('/cars')} 
              className="text-muted-foreground hover:text-foreground transition-smooth"
            >
              {t('nav.carRentals')}
            </button>
            <a href="#safety" className="text-muted-foreground hover:text-foreground transition-smooth">
              {t('nav.safety')}
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-smooth">
              {t('nav.pricing')}
            </a>
            <LanguageSwitcher />
            <Button variant="ghost" className="gap-2" onClick={() => navigate('/passenger/auth')}>
              <User className="h-4 w-4" />
              {t('nav.passengerLogin')}
            </Button>
            <Button variant="hero" className="gap-2" onClick={() => navigate('/driver/auth')}>
              <Car className="h-4 w-4" />
              {t('nav.driveWithUs')}
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
            <button 
              onClick={() => navigate('#features')} 
              className="block text-muted-foreground hover:text-foreground transition-smooth"
            >
              {t('nav.features')}
            </button>
            <button 
              onClick={() => navigate('/cars')} 
              className="block text-muted-foreground hover:text-foreground transition-smooth"
            >
              {t('nav.carRentals')}
            </button>
            <a href="#safety" className="block text-muted-foreground hover:text-foreground transition-smooth">
              {t('nav.safety')}
            </a>
            <a href="#pricing" className="block text-muted-foreground hover:text-foreground transition-smooth">
              {t('nav.pricing')}
            </a>
            <div className="flex flex-col gap-2">
              <LanguageSwitcher />
              <Button variant="ghost" className="gap-2 justify-start" onClick={() => navigate('/passenger/auth')}>
                <User className="h-4 w-4" />
                {t('nav.passengerLogin')}
              </Button>
              <Button variant="hero" className="gap-2 justify-start" onClick={() => navigate('/driver/auth')}>
                <Car className="h-4 w-4" />
                {t('nav.driveWithUs')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;