import { Button } from '@/components/ui/button';
import { MapPin, Clock, Shield, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import heroCarImage from '@/assets/taxi-cab-hero.jpg';
import appMockupImage from '@/assets/app-mockup.jpg';

const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-16 sm:py-20 lg:py-0">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroCarImage} 
          alt="Professional taxi cab for ride-hailing service"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="absolute inset-0 gradient-hero opacity-20" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="gradient-hero bg-clip-text text-transparent block">
                  {t('hero.title')}
                </span>
                <span className="text-foreground block mt-2">{t('hero.subtitle')}</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
                {t('hero.description')}
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0">
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20 flex-shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {t('hero.under3mins')}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0">
                <div className="p-1.5 sm:p-2 rounded-lg bg-accent/20 flex-shrink-0">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {t('hero.safe100')}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20 flex-shrink-0">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {t('hero.liveTracking')}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0">
                <div className="p-1.5 sm:p-2 rounded-lg bg-accent/20 flex-shrink-0">
                  <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {t('hero.smartAI')}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0">
              <Button 
                size="lg" 
                variant="hero" 
                className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 w-full sm:w-auto touch-manipulation"
                onClick={() => navigate('/passenger')}
              >
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('hero.bookRide')}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 w-full sm:w-auto touch-manipulation"
                onClick={() => navigate('/cars')}
              >
                {t('hero.rentCar')}
              </Button>
            </div>
            
            <div className="flex justify-center lg:justify-start">
              <Button 
                size="lg" 
                variant="ghost" 
                className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 touch-manipulation"
                onClick={() => navigate('/driver/auth')}
              >
                {t('hero.becomeDriver')}
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-8 pt-6 sm:pt-8 border-t border-border">
              <div className="text-center lg:text-left">
                <div className="text-xl sm:text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                  1M+
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Happy Riders</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl sm:text-2xl font-bold gradient-accent bg-clip-text text-transparent">
                  50K+
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Active Drivers</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl sm:text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Available</div>
              </div>
            </div>
          </div>

          {/* Right Content - App Mockup */}
          <div className="relative flex justify-center lg:justify-end mt-8 lg:mt-0">
            <div className="relative animate-float max-w-xs sm:max-w-sm lg:max-w-md">
              <img 
                src={appMockupImage}
                alt="RideNext mobile app interface"
                className="w-full h-auto rounded-2xl sm:rounded-3xl shadow-2xl glow-primary"
              />
              <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-12 h-12 sm:w-20 sm:h-20 gradient-accent rounded-full blur-xl opacity-60 animate-pulse" />
              <div className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-4 w-10 h-10 sm:w-16 sm:h-16 gradient-primary rounded-full blur-xl opacity-60 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;