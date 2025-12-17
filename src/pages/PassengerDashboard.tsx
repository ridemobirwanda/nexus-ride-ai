import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LogOut, MapPin, Users, Loader2, History, User, Car } from 'lucide-react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import CarCategorySelector from '@/components/CarCategorySelector';
import SeatFilterSelector from '@/components/SeatFilterSelector';
import ActiveRideCard from '@/components/ActiveRideCard';
import PassengerBottomNav from '@/components/PassengerBottomNav';

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

interface ActiveRide {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_fare: number;
  driver?: {
    name: string;
    car_model?: string;
    car_plate?: string;
  };
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
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Auth state and location detection
  useEffect(() => {
    const initializeApp = async () => {
      // Set up auth listener first
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      // Check existing session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // Auto-detect location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
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

      return () => subscription.unsubscribe();
    };

    initializeApp();
  }, [t]);

  // Fetch passenger profile and active rides
  useEffect(() => {
    const fetchPassengerData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch passenger profile
        const { data: passengerData, error: passengerError } = await supabase
          .from('passengers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (passengerError) throw passengerError;
        setPassenger(passengerData);

        // Fetch active rides (pending, accepted, in_progress)
        if (passengerData) {
          const { data: rideData, error: rideError } = await supabase
            .from('rides')
            .select(`
              id,
              status,
              pickup_address,
              dropoff_address,
              estimated_fare,
              driver:drivers(name, car_model, car_plate)
            `)
            .eq('passenger_id', passengerData.id)
            .in('status', ['pending', 'accepted', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!rideError && rideData) {
            setActiveRide(rideData);
          }
        }
      } catch (error: any) {
        console.error('Error fetching passenger data:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPassengerData();

    // Set up real-time subscription for ride updates
    if (passenger?.id) {
      const channel = supabase
        .channel('passenger-rides')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rides',
            filter: `passenger_id=eq.${passenger.id}`
          },
          (payload) => {
            if (payload.new) {
              const ride = payload.new as any;
              if (['pending', 'accepted', 'in_progress'].includes(ride.status)) {
                setActiveRide(ride);
              } else {
                setActiveRide(null);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, passenger?.id]);

  const handleCategorySelect = (category: CarCategory) => {
    setSelectedCategory(category);
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-20 lg:pb-0">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent truncate">
                RideNow
              </h1>
              <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">Passenger</Badge>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {user && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/passenger/history')}
                    className="hidden sm:flex"
                  >
                    <History className="h-4 w-4 mr-1" />
                    History
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/passenger/profile')}
                    className="hidden sm:flex"
                  >
                    <User className="h-4 w-4 mr-1" />
                    Profile
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="touch-manipulation">
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-2 hidden sm:inline">Sign Out</span>
                  </Button>
                </>
              )}
              {!user && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => navigate('/passenger/auth')}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-4xl">
        <div className="space-y-4 sm:space-y-6">
          {/* Active Ride Alert */}
          {activeRide && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Active Ride
              </h2>
              <ActiveRideCard ride={activeRide} />
            </div>
          )}

          {/* Quick Actions for Rentals */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Need a car for longer?</p>
                    <p className="text-xs text-muted-foreground">Rent a car by the hour or day</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/cars')}
                >
                  Browse Cars
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Location Display */}
          {currentLocation && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span>Your Current Location</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <p className="text-sm sm:text-base text-muted-foreground break-words">{currentLocation.address}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  This will be used as your pickup location
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Passenger Capacity Selection */}
          <Card>
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Step 1: How many passengers?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <SeatFilterSelector
                selectedSeats={selectedSeats}
                onSeatChange={setSelectedSeats}
              />
            </CardContent>
          </Card>

          {/* Step 2: Car Selection */}
          <Card>
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                  2
                </div>
                <span>Choose Your Ride</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
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
            <CardContent className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-center space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-base sm:text-lg">How it works</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-0">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Select passenger count</p>
                  </div>
                  <div className="text-center p-3 sm:p-0">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Choose your car type</p>
                  </div>
                  <div className="text-center p-3 sm:p-0">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Set destination & book</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <PassengerBottomNav />
    </div>
  );
};

export default PassengerDashboard;
