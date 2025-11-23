import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Car, Menu, X, User } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
      aria-label={t('nav.mainNavigation')}
      role="navigation"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-primary animate-pulse-glow" aria-hidden="true">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-hero bg-clip-text text-transparent">
              RideNext
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6" role="menubar">
            <button 
              onClick={() => navigate('#features')} 
              className="text-muted-foreground hover:text-foreground transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label={t('nav.features')}
              role="menuitem"
            >
              {t('nav.features')}
            </button>
            <button 
              onClick={() => navigate('/vehicles')} 
              className="text-muted-foreground hover:text-foreground transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label="View Vehicles"
              role="menuitem"
            >
              Vehicles
            </button>
            <button 
              onClick={() => navigate('/cars')} 
              className="text-muted-foreground hover:text-foreground transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label={t('nav.carRentals')}
              role="menuitem"
            >
              {t('nav.carRentals')}
            </button>
            <a 
              href="#safety" 
              className="text-muted-foreground hover:text-foreground transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label={t('nav.safety')}
              role="menuitem"
            >
              {t('nav.safety')}
            </a>
            <a 
              href="#pricing" 
              className="text-muted-foreground hover:text-foreground transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label={t('nav.pricing')}
              role="menuitem"
            >
              {t('nav.pricing')}
            </a>
            <LanguageSwitcher />
            <Button 
              variant="ghost" 
              className="gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-primary" 
              onClick={() => navigate('/passenger/auth')}
              aria-label={t('nav.passengerLogin')}
            >
              <User className="h-4 w-4" aria-hidden="true" />
              {t('nav.passengerLogin')}
            </Button>
            <Button 
              variant="hero" 
              className="gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-primary" 
              onClick={() => navigate('/driver/auth')}
              aria-label={t('nav.driveWithUs')}
            >
              <Car className="h-4 w-4" aria-hidden="true" />
              {t('nav.driveWithUs')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? t('accessibility.closeMenu') : t('accessibility.openMenu')}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden mt-4 pb-4 space-y-4 border-t border-border pt-4 animate-in slide-in-from-top-5"
            role="menu"
            aria-label={t('nav.mobileMenu')}
          >
            <button 
              onClick={() => { navigate('#features'); setIsMenuOpen(false); }}
              className="block w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              role="menuitem"
            >
              {t('nav.features')}
            </button>
            <button 
              onClick={() => { navigate('/vehicles'); setIsMenuOpen(false); }}
              className="block w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              role="menuitem"
            >
              Vehicles
            </button>
            <button 
              onClick={() => { navigate('/cars'); setIsMenuOpen(false); }}
              className="block w-full text-left px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              role="menuitem"
            >
              {t('nav.carRentals')}
            </button>
            <a 
              href="#safety" 
              className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.safety')}
            </a>
            <a 
              href="#pricing" 
              className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.pricing')}
            </a>
            <div className="flex flex-col gap-2 px-4">
              <LanguageSwitcher />
              <Button 
                variant="ghost" 
                className="w-full gap-2 justify-start focus:ring-2 focus:ring-offset-2 focus:ring-primary" 
                onClick={() => { navigate('/passenger/auth'); setIsMenuOpen(false); }}
                aria-label={t('nav.passengerLogin')}
              >
                <User className="h-4 w-4" aria-hidden="true" />
                {t('nav.passengerLogin')}
              </Button>
              <Button 
                variant="hero" 
                className="w-full gap-2 justify-start focus:ring-2 focus:ring-offset-2 focus:ring-primary" 
                onClick={() => { navigate('/driver/auth'); setIsMenuOpen(false); }}
                aria-label={t('nav.driveWithUs')}
              >
                <Car className="h-4 w-4" aria-hidden="true" />
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
