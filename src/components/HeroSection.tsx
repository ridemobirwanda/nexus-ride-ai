import { Button } from '@/components/ui/button';
import { MapPin, Clock, Shield, Smartphone } from 'lucide-react';
import heroCarImage from '@/assets/taxi-cab-hero.jpg';
import appMockupImage from '@/assets/app-mockup.jpg';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="gradient-hero bg-clip-text text-transparent">
                  Future
                </span>
                <br />
                <span className="text-foreground">of Mobility</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Experience the next generation of ride-hailing with AI-powered matching, 
                real-time tracking, and seamless payments.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Under 3 mins
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">
                  100% Safe
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Live Tracking
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Smartphone className="h-5 w-5 text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Smart AI
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                variant="hero" 
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = '/passenger/auth'}
              >
                <MapPin className="h-5 w-5" />
                Book a Ride
              </Button>
              <Button 
                size="lg" 
                variant="ghost" 
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = '/driver/auth'}
              >
                Become a Driver
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-8 border-t border-border">
              <div>
                <div className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                  1M+
                </div>
                <div className="text-sm text-muted-foreground">Happy Riders</div>
              </div>
              <div>
                <div className="text-2xl font-bold gradient-accent bg-clip-text text-transparent">
                  50K+
                </div>
                <div className="text-sm text-muted-foreground">Active Drivers</div>
              </div>
              <div>
                <div className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>
          </div>

          {/* Right Content - App Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative animate-float">
              <img 
                src={appMockupImage}
                alt="RideNext mobile app interface"
                className="max-w-sm w-full h-auto rounded-3xl shadow-2xl glow-primary"
              />
              <div className="absolute -top-4 -right-4 w-20 h-20 gradient-accent rounded-full blur-xl opacity-60 animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 gradient-primary rounded-full blur-xl opacity-60 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;