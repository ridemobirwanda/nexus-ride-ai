import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LogOut, MapPin, Users, Loader2 } from 'lucide-react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import CarCategorySelector from '@/components/CarCategorySelector';
import SeatFilterSelector from '@/components/SeatFilterSelector';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface Passenger {
  id: string;
  name: string;
  phone: string;
  profile_pic?: string;
}

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface CarCategory {
  id: string;
  name: string;
  description: string;
  base_fare: number;
  base_price_per_km: number;
  minimum_fare: number;
  passenger_capacity: number;
  features: string[];
  image_url?: string;
}

const PassengerDashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CarCategory | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Auth state and location detection
  useEffect(() => {
    const initializeApp = async () => {
      // Check auth
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // Auto-detect location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              // Reverse geocoding using a simple approach
              const location: Location = {
                lat: latitude,
                lng: longitude,
                address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              };
              
              setCurrentLocation(location);
              toast({
                title: t('toast.locationDetected'),
                description: t('toast.locationDetectedDesc')
              });
            } catch (error) {
              console.error('Geocoding error:', error);
              setCurrentLocation({
                lat: latitude,
                lng: longitude,
                address: 'Current Location'
              });
            }
            setIsDetectingLocation(false);
          },
          (error) => {
            console.error('Location error:', error);
            toast({
              title: t('toast.locationAccess'),
              description: t('toast.locationAccessDesc'),
              variant: "destructive"
            });
            setIsDetectingLocation(false);
          }
        );
      } else {
        setIsDetectingLocation(false);
        toast({
          title: t('toast.locationNotAvailable'),
          description: t('toast.locationNotAvailableDesc'),
          variant: "destructive"
        });
      }
    };

    initializeApp();
  }, []);

  // Fetch passenger profile
  useEffect(() => {
    const fetchPassengerProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('passengers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setPassenger(data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPassengerProfile();
  }, [user]);

  const handleCategorySelect = (category: CarCategory) => {
    setSelectedCategory(category);
    // Navigate to booking page with selected category and location
    navigate(`/passenger/book-ride?category=${category.id}&lat=${currentLocation?.lat}&lng=${currentLocation?.lng}&address=${encodeURIComponent(currentLocation?.address || '')}`);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading || isDetectingLocation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              {isDetectingLocation ? 'Detecting Your Location...' : 'Loading RideNow...'}
            </h2>
            <p className="text-muted-foreground">
              {isDetectingLocation ? 'Please allow location access for better experience' : 'Setting up your ride experience'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                RideNow
              </h1>
              <Badge variant="secondary" className="text-xs">Passenger</Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {passenger?.name || user?.email || 'Guest'}
              </span>
              {user && (
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Current Location Display */}
          {currentLocation && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Your Current Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{currentLocation.address}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This will be used as your pickup location
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Passenger Capacity Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Step 1: How many passengers?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SeatFilterSelector
                selectedSeats={selectedSeats}
                onSeatChange={setSelectedSeats}
              />
            </CardContent>
          </Card>

          {/* Step 2: Car Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                Choose Your Ride
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CarCategorySelector
                selectedCategoryId={selectedCategory?.id}
                onCategorySelect={handleCategorySelect}
                showPricing={false}
                seatFilter={selectedSeats}
              />
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">How it works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                    <p className="text-sm text-muted-foreground">Select passenger count</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                    <p className="text-sm text-muted-foreground">Choose your car type</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                    <p className="text-sm text-muted-foreground">Set destination & book</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PassengerDashboard;