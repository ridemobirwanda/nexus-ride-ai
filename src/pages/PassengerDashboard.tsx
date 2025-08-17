import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DollarSign
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

  // Fetch nearby drivers
  useEffect(() => {
    const fetchNearbyDrivers = async () => {
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('is_available', true)
          .limit(5);

        if (error) throw error;
        setNearbyDrivers(data || []);
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
    // Simple fare calculation (in real app, this would use distance/duration APIs)
    if (rideData.pickupAddress && rideData.dropoffAddress) {
      const baseFare = 5.00;
      const distanceMultiplier = Math.random() * 20 + 5; // Mock distance
      return baseFare + (distanceMultiplier * 1.5);
    }
    return 0;
  };

  const handleBookRide = async () => {
    if (!passenger || !rideData.pickupAddress || !rideData.dropoffAddress) {
      toast({
        title: "Error",
        description: "Please fill in both pickup and dropoff locations",
        variant: "destructive"
      });
      return;
    }

    try {
      const estimatedFare = calculateEstimatedFare();
      
      // Create a ride request
      const { data, error } = await supabase
        .from('rides')
        .insert({
          passenger_id: passenger.id,
          pickup_address: rideData.pickupAddress,
          dropoff_address: rideData.dropoffAddress,
          pickup_location: `POINT(0 0)`, // Mock coordinates
          dropoff_location: `POINT(1 1)`, // Mock coordinates
          estimated_fare: estimatedFare,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ride Booked!",
        description: "Looking for nearby drivers...",
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">RideNow</h1>
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

            {rideData.pickupAddress && rideData.dropoffAddress && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Estimated Fare:</span>
                  <span className="text-xl font-bold text-primary">
                    ${calculateEstimatedFare().toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleBookRide}
              className="w-full"
              variant="hero"
              size="lg"
              disabled={!rideData.pickupAddress || !rideData.dropoffAddress}
            >
              <Search className="h-4 w-4 mr-2" />
              Find Drivers
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
                          {driver.car_model} • {driver.car_plate}
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