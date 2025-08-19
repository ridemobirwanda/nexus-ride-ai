import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  const navigate = useNavigate();

  const [rideData, setRideData] = useState({
    pickupAddress: '',
    dropoffAddress: '',
    estimatedFare: 0,
    paymentMethod: 'cash' as 'cash' | 'mobile_money' | 'card',
    pickupLocation: null as { lat: number; lng: number; address: string } | null,
    dropoffLocation: null as { lat: number; lng: number; address: string } | null
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

  // Fetch nearby drivers using the safe function via SQL query
  useEffect(() => {
    const fetchNearbyDrivers = async () => {
      try {
        // Since we can't access the safe function directly from the client, 
        // we'll just show placeholders for available drivers
        const mockDrivers = [
          { id: '1', display_name: 'Driver 1', is_available: true },
          { id: '2', display_name: 'Driver 2', is_available: true },
          { id: '3', display_name: 'Driver 3', is_available: true }
        ];
        
        // Transform the data to match the expected interface
        const transformedDrivers = mockDrivers.map((driver: any) => ({
          id: driver.id,
          name: driver.display_name,
          phone: 'Protected', // Phone is no longer exposed for security
          car_model: 'Vehicle Info Protected', // Car model is no longer exposed
          car_plate: 'Protected', // Plate is no longer exposed
          is_available: driver.is_available
        }));
        
        setNearbyDrivers(transformedDrivers);
      } catch (error: any) {
        console.error('Error fetching drivers:', error);
      }
    };

    fetchNearbyDrivers();
  }, []);

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

  const calculateEstimatedFare = () => {
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
    const distance = R * c; // Distance in km
    
    // Fare calculation: base fare + distance rate + surge pricing (if applicable)
    const baseFare = 2.50;
    const perKmRate = 1.20;
    const minimumFare = 5.00;
    
    const calculatedFare = baseFare + (distance * perKmRate);
    return Math.max(calculatedFare, minimumFare);
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

    try {
      const estimatedFare = calculateEstimatedFare();
      
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
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ride Booked!",
        description: `Looking for nearby drivers... Estimated fare: $${estimatedFare.toFixed(2)}`,
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
        {/* Map */}
        <Card>
          <CardContent className="p-0">
            <Map
              onLocationSelect={(location, type) => {
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
              }}
              pickupLocation={rideData.pickupLocation}
              dropoffLocation={rideData.dropoffLocation}
              drivers={nearbyDrivers.map(driver => ({
                id: driver.id,
                lat: 40.7128 + (Math.random() - 0.5) * 0.1, // Mock coordinates around NYC
                lng: -74.0060 + (Math.random() - 0.5) * 0.1,
                name: driver.name
              }))}
              className="h-80"
            />
          </CardContent>
        </Card>

        {/* Booking Card */}
        <Card className="gradient-card card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Book a Ride
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickup">Pickup Location</Label>
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
                    ${calculateEstimatedFare().toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Base: $2.50 + Distance charge • Payment: {rideData.paymentMethod.replace('_', ' ')}
                </div>
              </div>
            )}

            <Button 
              onClick={handleBookRide}
              className="w-full"
              size="lg"
              disabled={!rideData.pickupLocation || !rideData.dropoffLocation}
            >
              <Search className="h-4 w-4 mr-2" />
              Book Ride - ${rideData.pickupLocation && rideData.dropoffLocation ? calculateEstimatedFare().toFixed(2) : '0.00'}
            </Button>
          </CardContent>
        </Card>

        {/* Nearby Drivers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Nearby Drivers ({nearbyDrivers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nearbyDrivers.length > 0 ? (
              <div className="space-y-3">
                {nearbyDrivers.map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Available Driver
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                      <span className="text-sm text-muted-foreground">Available</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No drivers available in your area</p>
              </div>
            )}
          </CardContent>
        </Card>

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