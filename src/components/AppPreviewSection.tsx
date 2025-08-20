import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Car, 
  MapPin, 
  CreditCard, 
  User,
  Navigation,
  Clock,
  Star
} from 'lucide-react';
import mapBgImage from '@/assets/map-bg.jpg';

const AppPreviewSection = () => {
  const [activeTab, setActiveTab] = useState('passenger');
  const [destination, setDestination] = useState('');
  const [selectedRideType, setSelectedRideType] = useState('standard');
  const [showEstimate, setShowEstimate] = useState(false);

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
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Where to?"
                            value={destination}
                            onChange={handleDestinationChange}
                            className="pl-10 h-10 bg-background border-muted"
                          />
                        </div>
                        
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
                            onClick={() => alert('Demo: Ride booking would start here!')}
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
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Ready to get started?</h3>
            <p className="text-muted-foreground">Download the app and experience the future of mobility</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="gap-2">
                <Smartphone className="h-5 w-5" />
                Download Passenger App
              </Button>
              <Button variant="accent" size="lg" className="gap-2">
                <Car className="h-5 w-5" />
                Download Driver App
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPreviewSection;