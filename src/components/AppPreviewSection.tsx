import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Smartphone, 
  Car, 
  MapPin, 
  CreditCard, 
  User,
  Navigation,
  Clock,
  Star,
  Loader2,
  Crosshair,
  Apple,
  Download
} from 'lucide-react';
import mapBgImage from '@/assets/map-bg.jpg';
import { useToast } from '@/hooks/use-toast';
import { usePWA } from '@/hooks/usePWA';

const AppPreviewSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [activeTab, setActiveTab] = useState('passenger');
  const [destination, setDestination] = useState('');
  const [selectedRideType, setSelectedRideType] = useState('standard');
  const [showEstimate, setShowEstimate] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  // Detect platform
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/i.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }
  }, []);

  // Real-time location tracking
  useEffect(() => {
    if (activeTab === 'passenger' && 'geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationCoords({ lat: latitude, lng: longitude });
          
          // Simulate address geocoding (in real app, you'd use Mapbox or Google Maps API)
          const mockAddresses = [
            '123 Tech Street, San Francisco, CA',
            '456 Innovation Ave, Palo Alto, CA', 
            '789 Startup Blvd, Mountain View, CA',
            '321 Silicon Way, Cupertino, CA'
          ];
          const randomAddress = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
          setCurrentLocation(randomAddress);
        },
        (error) => {
          console.log('Location error:', error);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 30000 
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [activeTab]);

  const handleGetCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoords({ lat: latitude, lng: longitude });
        
        // Simulate reverse geocoding
        const mockAddresses = [
          '123 Current Street, Your City, State',
          '456 Live Location Ave, Your Area, State',
          '789 Real Time Blvd, Your District, State'
        ];
        const randomAddress = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
        setCurrentLocation(randomAddress);
        setDestination(randomAddress);
        setShowEstimate(true);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLoadingLocation(false);
        alert('Unable to get your location. Please check your browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDestination(e.target.value);
    if (e.target.value.length > 2) {
      setShowEstimate(true);
    } else {
      setShowEstimate(false);
    }
  };

  const handleRideTypeSelect = (type: 'standard' | 'premium') => {
    setSelectedRideType(type);
    if (destination.length > 2) {
      setShowEstimate(true);
    }
  };

  const handlePassengerDownload = async (store?: 'ios' | 'android') => {
    if (store === 'ios') {
      // iOS - Guide to install PWA
      if (platform === 'ios') {
        toast({
          title: "Install Nexus Ride on iOS",
          description: "Tap the Share button in Safari, then 'Add to Home Screen' to install",
          duration: 10000,
        });
      } else {
        // On non-iOS, show how to install as PWA or try install prompt
        if (isInstallable) {
          const installed = await installApp();
          if (installed) {
            toast({
              title: "App Installed!",
              description: "Nexus Ride has been added to your home screen",
            });
          }
        } else {
          toast({
            title: "Install Nexus Ride",
            description: "Use your browser menu to 'Add to Home Screen' or 'Install App'",
            duration: 8000,
          });
        }
      }
    } else if (store === 'android') {
      // Android - Show install prompt
      if (isInstallable) {
        const installed = await installApp();
        if (installed) {
          toast({
            title: "App Installed!",
            description: "Nexus Ride has been added to your home screen",
          });
        }
      } else if (platform === 'android') {
        toast({
          title: "Install Nexus Ride",
          description: "Tap the browser menu (⋮) and select 'Add to Home Screen' or 'Install App'",
          duration: 8000,
        });
      } else {
        toast({
          title: "Install Nexus Ride",
          description: "Use your browser menu to install this app to your device",
          duration: 8000,
        });
      }
    } else {
      // Direct install for PWA or redirect to booking
      if (isInstallable && !isInstalled) {
        const installed = await installApp();
        if (installed) {
          toast({
            title: "App Installed!",
            description: "Nexus Ride has been added to your home screen",
          });
          setTimeout(() => navigate('/passenger/auth'), 1000);
        }
      } else if (isInstalled) {
        navigate('/passenger/auth');
      } else if (platform === 'ios') {
        toast({
          title: "Install Nexus Ride",
          description: "Tap Share → Add to Home Screen in Safari to install",
          duration: 8000,
        });
      } else {
        // Fallback - just navigate to auth
        toast({
          title: "Welcome!",
          description: "Sign up to start booking rides instantly",
        });
        navigate('/passenger/auth');
      }
    }
  };

  const handleDriverDownload = async (store?: 'ios' | 'android') => {
    if (store === 'ios') {
      if (platform === 'ios') {
        toast({
          title: "Install Driver App on iOS",
          description: "Tap the Share button in Safari, then 'Add to Home Screen' to install",
          duration: 10000,
        });
      } else if (isInstallable) {
        const installed = await installApp();
        if (installed) {
          toast({
            title: "App Installed!",
            description: "Nexus Ride Driver has been added to your home screen",
          });
          setTimeout(() => navigate('/driver/auth'), 1000);
        }
      } else {
        toast({
          title: "Install Driver App",
          description: "Use your browser menu to 'Add to Home Screen'",
          duration: 8000,
        });
      }
    } else if (store === 'android') {
      if (isInstallable) {
        const installed = await installApp();
        if (installed) {
          toast({
            title: "App Installed!",
            description: "Nexus Ride Driver has been added to your home screen",
          });
          setTimeout(() => navigate('/driver/auth'), 1000);
        }
      } else {
        toast({
          title: "Install Driver App",
          description: "Tap browser menu (⋮) → 'Add to Home Screen' or 'Install App'",
          duration: 8000,
        });
      }
    } else {
      // Direct action - try to install or redirect
      if (isInstallable) {
        const installed = await installApp();
        if (installed) {
          toast({
            title: "App Installed!",
            description: "Nexus Ride has been added to your home screen",
          });
          setTimeout(() => navigate('/driver/auth'), 1000);
        }
      } else {
        toast({
          title: "Join Our Driver Network!",
          description: "Complete registration to start earning",
        });
        navigate('/driver/auth');
      }
    }
  };

  const passengerFeatures = [
    {
      icon: MapPin,
      title: "Easy Pickup Location",
      description: "Set your location with a single tap or use GPS auto-detection"
    },
    {
      icon: Navigation,
      title: "Route Optimization",
      description: "AI-powered route planning for the fastest journey"
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Multiple payment options with secure encryption"
    },
    {
      icon: Star,
      title: "Rate & Review",
      description: "Help maintain quality by rating your experience"
    }
  ];

  const driverFeatures = [
    {
      icon: Car,
      title: "Smart Trip Matching",
      description: "AI matches you with passengers on optimal routes"
    },
    {
      icon: Clock,
      title: "Flexible Schedule",
      description: "Drive when you want with complete schedule control"
    },
    {
      icon: User,
      title: "Profile Verification",
      description: "Secure verification process for safety and trust"
    },
    {
      icon: Navigation,
      title: "Navigation Support",
      description: "Built-in GPS navigation with real-time traffic updates"
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={mapBgImage}
          alt="Futuristic city map"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Designed for{" "}
            <span className="gradient-hero bg-clip-text text-transparent">
              Everyone
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're looking for a ride or want to drive, 
            our app is designed to meet your needs perfectly
          </p>
        </div>

        {/* App Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-12 h-14 bg-muted/50 rounded-xl">
            <TabsTrigger 
              value="passenger" 
              className="text-lg py-3 data-[state=active]:gradient-primary data-[state=active]:text-white"
            >
              <User className="h-5 w-5 mr-2" />
              For Passengers
            </TabsTrigger>
            <TabsTrigger 
              value="driver"
              className="text-lg py-3 data-[state=active]:gradient-accent data-[state=active]:text-white"
            >
              <Car className="h-5 w-5 mr-2" />
              For Drivers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="passenger" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* App Interface Mockup */}
              <div className="relative">
                <Card className="p-8 gradient-card card-shadow">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg gradient-primary">
                        <Smartphone className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold">Passenger App</h3>
                    </div>
                    
                    {/* Mock App Screen */}
                    <div className="bg-background/50 rounded-xl p-6 space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full gradient-primary" />
                        <div>
                          <div className="h-3 bg-muted rounded w-20 mb-1" />
                          <div className="h-2 bg-muted/50 rounded w-16" />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Current Location Display */}
                        {currentLocation && (
                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <span className="text-xs text-primary font-medium">Live: {currentLocation}</span>
                          </div>
                        )}
                        
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Where to?"
                            value={destination}
                            onChange={handleDestinationChange}
                            className="pl-10 pr-12 h-10 bg-background border-muted"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleGetCurrentLocation}
                            disabled={isLoadingLocation}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          >
                            {isLoadingLocation ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Crosshair className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        {locationCoords && (
                          <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                            📍 GPS: {locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}
                          </div>
                        )}
                        
                        {showEstimate && (
                          <div className="h-8 bg-muted/50 rounded px-3 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Estimated time:</span>
                            <span className="font-medium">12 min</span>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleRideTypeSelect('standard')}
                            className={`h-12 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                              selectedRideType === 'standard'
                                ? 'bg-primary/30 border-primary text-primary shadow-lg'
                                : 'bg-primary/20 border-primary/30 text-primary hover:bg-primary/25'
                            }`}
                          >
                            <Car className="h-4 w-4" />
                            <span className="text-xs font-medium">Standard</span>
                          </button>
                          <button
                            onClick={() => handleRideTypeSelect('premium')}
                            className={`h-12 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                              selectedRideType === 'premium'
                                ? 'bg-accent/30 border-accent text-accent shadow-lg'
                                : 'bg-accent/20 border-accent/30 text-accent hover:bg-accent/25'
                            }`}
                          >
                            <User className="h-4 w-4" />
                            <span className="text-xs font-medium">Premium</span>
                          </button>
                        </div>
                        
                        {showEstimate && (
                          <Button 
                            variant="hero" 
                            className="w-full mt-4"
                            onClick={() => alert(`Demo: Booking ${selectedRideType} ride from ${currentLocation || 'current location'} to ${destination}`)}
                          >
                            Book {selectedRideType === 'premium' ? 'Premium' : 'Standard'} Ride - $
                            {selectedRideType === 'premium' ? '18.50' : '12.30'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Features */}
              <div className="space-y-6">
                {passengerFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/20 glow-primary">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="driver" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Features */}
              <div className="space-y-6">
                {driverFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-accent/20 glow-accent">
                      <feature.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* App Interface Mockup */}
              <div className="relative">
                <Card className="p-8 gradient-card card-shadow">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg gradient-accent">
                        <Car className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold">Driver App</h3>
                    </div>
                    
                    {/* Mock App Screen */}
                    <div className="bg-background/50 rounded-xl p-6 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
                          <span className="text-sm font-medium">Online</span>
                        </div>
                        <div className="text-sm text-muted-foreground">$127.50 today</div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">New Ride Request</span>
                            <span className="text-accent font-bold">$15.60</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            2.3 km away • 8 min trip
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" className="flex-1">Decline</Button>
                          <Button variant="accent" className="flex-1">Accept</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Download CTA */}
        <div className="text-center mt-16">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Ready to get started?</h3>
              <p className="text-muted-foreground">Start riding or driving today</p>
            </div>
            
            {/* Passenger Download */}
            <div className="max-w-2xl mx-auto">
              <h4 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                For Passengers
              </h4>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {platform === 'ios' || platform === 'other' ? (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="gap-2 min-w-[180px]"
                    onClick={() => handlePassengerDownload('ios')}
                  >
                    <Apple className="h-5 w-5" />
                    App Store
                  </Button>
                ) : null}
                {platform === 'android' || platform === 'other' ? (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="gap-2 min-w-[180px]"
                    onClick={() => handlePassengerDownload('android')}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    Google Play
                  </Button>
                ) : null}
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="gap-2 min-w-[180px]"
                  onClick={() => handlePassengerDownload()}
                >
                  <Download className="h-5 w-5" />
                  {isInstallable ? 'Install App' : isInstalled ? 'Open App' : 'Book a Ride Now'}
                </Button>
              </div>
            </div>

            {/* Driver Download */}
            <div className="max-w-2xl mx-auto pt-6 border-t border-border/50">
              <h4 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
                <Car className="h-5 w-5 text-accent" />
                For Drivers
              </h4>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {platform === 'ios' || platform === 'other' ? (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="gap-2 min-w-[180px]"
                    onClick={() => handleDriverDownload('ios')}
                  >
                    <Apple className="h-5 w-5" />
                    App Store
                  </Button>
                ) : null}
                {platform === 'android' || platform === 'other' ? (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="gap-2 min-w-[180px]"
                    onClick={() => handleDriverDownload('android')}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    Google Play
                  </Button>
                ) : null}
                <Button 
                  variant="accent" 
                  size="lg" 
                  className="gap-2 min-w-[180px]"
                  onClick={() => handleDriverDownload()}
                >
                  <Download className="h-5 w-5" />
                  Start Driving
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground pt-4">
              Available on iOS, Android, and Web
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPreviewSection;