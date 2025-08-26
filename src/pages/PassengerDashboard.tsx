import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import LiveDriverMap from '@/components/LiveDriverMap';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  User, 
  LogOut, 
  Car,
  Search,
  DollarSign,
  CreditCard,
  Smartphone
} from 'lucide-react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import Map from '@/components/Map';
import CarCategorySelector from '@/components/CarCategorySelector';
import CurrentLocationButton from '@/components/CurrentLocationButton';

interface Passenger {
  id: string;
  name: string;
  phone: string;
  profile_pic?: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  car_model: string;
  car_plate: string;
  is_available: boolean;
}

const PassengerDashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const navigate = useNavigate();

  const [rideData, setRideData] = useState({
    pickupAddress: '',
    dropoffAddress: '',
    estimatedFare: 0,
    paymentMethod: 'cash' as 'cash' | 'mobile_money' | 'card',
    pickupLocation: null as { lat: number; lng: number; address: string } | null,
    dropoffLocation: null as { lat: number; lng: number; address: string } | null,
    selectedCarCategory: null as any
  });

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/passenger/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/passenger/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch passenger profile
  useEffect(() => {
    const fetchPassengerProfile = async () => {
      if (!user) return;

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

  // Check for active rides
  useEffect(() => {
    const fetchActiveRide = async () => {
      if (!passenger) return;

      try {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('passenger_id', passenger.id)
          .in('status', ['pending', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setCurrentRide(data);
      } catch (error: any) {
        console.error('Error fetching active ride:', error);
      }
    };

    fetchActiveRide();
  }, [passenger]);

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

  const calculateDistance = () => {
    if (!rideData.pickupLocation || !rideData.dropoffLocation) return 0;
    
    // Calculate distance using Haversine formula
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Radius of Earth in km
    
    const lat1 = rideData.pickupLocation.lat;
    const lon1 = rideData.pickupLocation.lng;
    const lat2 = rideData.dropoffLocation.lat;
    const lon2 = rideData.dropoffLocation.lng;
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const calculateEstimatedFare = () => {
    if (!rideData.pickupLocation || !rideData.dropoffLocation || !rideData.selectedCarCategory) return 0;
    
    const distance = calculateDistance();
    const category = rideData.selectedCarCategory;
    
    // Calculate fare: base_fare + (distance * price_per_km * passenger_capacity)
    const farePerKm = category.base_price_per_km * category.passenger_capacity;
    const calculatedFare = category.base_fare + (distance * farePerKm);
    return Math.max(calculatedFare, category.minimum_fare);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} RWF`;
  };

  const handleBookRide = async () => {
    if (!passenger || !rideData.pickupLocation || !rideData.dropoffLocation) {
      toast({
        title: "Error",
        description: "Please select both pickup and dropoff locations on the map",
        variant: "destructive"
      });
      return;
    }

    if (!rideData.selectedCarCategory) {
      toast({
        title: "Error",
        description: "Please select a car category",
        variant: "destructive"
      });
      return;
    }

    try {
      const estimatedFare = calculateEstimatedFare();
      
      // First, use smart matching to find best driver
      toast({
        title: "Finding Drivers",
        description: "Using smart matching to find the best driver for you...",
      });

      const { data: matchingResult, error: matchingError } = await supabase.functions.invoke(
        'smart-driver-matching',
        {
          body: {
            pickup_lat: rideData.pickupLocation.lat,
            pickup_lng: rideData.pickupLocation.lng,
            max_distance_km: 10,
            max_drivers: 5
          }
        }
      );

      if (matchingError) {
        console.error('Smart matching failed:', matchingError);
        // Continue with normal booking even if smart matching fails
      } else {
        console.log('Smart matching result:', matchingResult);
        if (matchingResult.drivers.length === 0) {
          toast({
            title: "No Drivers Available",
            description: "No drivers found in your area. Please try again later.",
            variant: "destructive"
          });
          return;
        }
      }
      
      // Create a ride request with actual coordinates
      const { data, error } = await supabase
        .from('rides')
        .insert({
          passenger_id: passenger.id,
          pickup_address: rideData.pickupAddress,
          dropoff_address: rideData.dropoffAddress,
          pickup_location: `POINT(${rideData.pickupLocation.lng} ${rideData.pickupLocation.lat})`,
          dropoff_location: `POINT(${rideData.dropoffLocation.lng} ${rideData.dropoffLocation.lat})`,
          estimated_fare: estimatedFare,
          payment_method: rideData.paymentMethod,
          car_category_id: rideData.selectedCarCategory.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      const driversFound = matchingResult?.drivers?.length || 0;
      toast({
        title: "Ride Booked!",
        description: `Found ${driversFound} drivers nearby. Estimated fare: ${formatCurrency(estimatedFare)}`,
      });

      // Navigate to ride status page
      navigate(`/passenger/ride/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rider-bg">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b px-4 py-3 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold gradient-hero bg-clip-text text-transparent">RideNow</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {passenger?.name || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Live Driver Map */}
        <Card>
          <CardContent className="p-0">
            <Map
              onLocationSelect={!currentRide ? (location, type) => {
                if (type === 'pickup') {
                  setRideData({ 
                    ...rideData, 
                    pickupLocation: location, 
                    pickupAddress: location.address 
                  });
                } else {
                  setRideData({ 
                    ...rideData, 
                    dropoffLocation: location, 
                    dropoffAddress: location.address 
                  });
                }
              } : undefined}
              pickupLocation={rideData.pickupLocation}
              dropoffLocation={rideData.dropoffLocation}
              assignedDriverId={currentRide?.driver_id}
              showAllDrivers={!currentRide}
              className="h-80"
            />
          </CardContent>
        </Card>

        {/* Car Category Selection */}
        {!currentRide && (
          <CarCategorySelector
            selectedCategoryId={rideData.selectedCarCategory?.id}
            onCategorySelect={(category) => setRideData({ ...rideData, selectedCarCategory: category })}
            showPricing={true}
            distance={calculateDistance()}
          />
        )}

        {/* Booking Card */}
        <Card className="gradient-card card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              {currentRide ? (
                currentRide.status === 'pending' ? 'Finding Driver...' :
                currentRide.status === 'accepted' ? 'Driver En Route' :
                'Ride In Progress'
              ) : 'Book a Ride'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickup">Pickup Location</Label>
              <div className="space-y-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pickup"
                    placeholder="Select on map or enter pickup location"
                    className="pl-10"
                    value={rideData.pickupAddress}
                    onChange={(e) => setRideData({ ...rideData, pickupAddress: e.target.value })}
                  />
                </div>
                <CurrentLocationButton
                  onLocationFound={(location) => {
                    setRideData({ 
                      ...rideData, 
                      pickupLocation: location, 
                      pickupAddress: location.address 
                    });
                  }}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dropoff">Dropoff Location</Label>
              <div className="relative">
                <Navigation className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dropoff"
                  placeholder="Select on map or enter destination"
                  className="pl-10"
                  value={rideData.dropoffAddress}
                  onChange={(e) => {
                    setRideData({ ...rideData, dropoffAddress: e.target.value });
                  }}
                />
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Payment Method</Label>
              <RadioGroup
                value={rideData.paymentMethod}
                onValueChange={(value: 'cash' | 'mobile_money' | 'card') => 
                  setRideData({ ...rideData, paymentMethod: value })
                }
                className="grid grid-cols-1 gap-3"
              >
                <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="cash" id="cash" />
                  <div className="flex items-center gap-2 flex-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <Label htmlFor="cash" className="cursor-pointer flex-1">Cash Payment</Label>
                  </div>
                </div>
                <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                  <RadioGroupItem value="mobile_money" id="mobile_money" />
                  <div className="flex items-center gap-2 flex-1">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                    <Label htmlFor="mobile_money" className="cursor-pointer flex-1">Mobile Money</Label>
                  </div>
                </div>
                <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/30 transition-colors opacity-50">
                  <RadioGroupItem value="card" id="card" disabled />
                  <div className="flex items-center gap-2 flex-1">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <Label htmlFor="card" className="cursor-pointer flex-1">Card Payment (Coming Soon)</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {rideData.pickupLocation && rideData.dropoffLocation && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Estimated Fare:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(calculateEstimatedFare())}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Distance: {calculateDistance().toFixed(1)}km • {rideData.selectedCarCategory?.passenger_capacity} passengers • Payment: {rideData.paymentMethod.replace('_', ' ')}
                </div>
                <div className="text-xs text-muted-foreground">
                  Base: {formatCurrency(rideData.selectedCarCategory?.base_fare || 0)} + {formatCurrency((rideData.selectedCarCategory?.base_price_per_km || 0) * (rideData.selectedCarCategory?.passenger_capacity || 1))}/km
                </div>
              </div>
            )}

            {!currentRide ? (
              <Button 
                onClick={handleBookRide}
                className="w-full"
                size="lg"
                disabled={!rideData.pickupLocation || !rideData.dropoffLocation || !rideData.selectedCarCategory}
              >
                <Search className="h-4 w-4 mr-2" />
                Book Ride - {rideData.pickupLocation && rideData.dropoffLocation && rideData.selectedCarCategory ? formatCurrency(calculateEstimatedFare()) : '0 RWF'}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <div className="font-medium text-primary">
                    {currentRide.status === 'pending' && '🔍 Searching for drivers...'}
                    {currentRide.status === 'accepted' && '🚗 Driver assigned and en route'}
                    {currentRide.status === 'in_progress' && '🏁 Ride in progress'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Ride ID: {currentRide.id}
                  </div>
                </div>
                <Button 
                  onClick={() => navigate(`/passenger/ride/${currentRide.id}`)}
                  className="w-full"
                  size="lg"
                >
                  View Ride Details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Drivers Map */}
        <LiveDriverMap className="mb-6" />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-auto p-4 flex-col gap-2"
            onClick={() => navigate('/passenger/history')}
          >
            <Clock className="h-6 w-6" />
            <span>Ride History</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto p-4 flex-col gap-2"
            onClick={() => navigate('/passenger/profile')}
          >
            <User className="h-6 w-6" />
            <span>Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PassengerDashboard;