import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import LocationTracker from '@/components/LocationTracker';
import EarningsDashboard from '@/components/EarningsDashboard';
import { 
  Car, 
  DollarSign, 
  Clock, 
  User, 
  LogOut, 
  MapPin,
  Navigation,
  Phone,
  MessageCircle
} from 'lucide-react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface Driver {
  id: string;
  name: string;
  phone: string;
  car_model: string;
  car_plate: string;
  is_available: boolean;
}

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  estimated_fare: number;
  created_at: string;
  passenger: {
    name: string;
    phone: string;
  };
}

const DriverDashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const navigate = useNavigate();

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/driver/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/driver/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch driver profile
  useEffect(() => {
    const fetchDriverProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setDriver(data);
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

    fetchDriverProfile();
  }, [user]);

  // Fetch pending rides and active ride
  useEffect(() => {
    const fetchRides = async () => {
      if (!driver) return;

      try {
        // Fetch pending rides
        const { data: pending, error: pendingError } = await supabase
          .from('rides')
          .select(`
            *,
            passenger:passengers(name, phone)
          `)
          .eq('status', 'pending')
          .limit(10);

        if (pendingError) throw pendingError;
        setPendingRides(pending || []);

        // Fetch active ride for this driver
        const { data: active, error: activeError } = await supabase
          .from('rides')
          .select(`
            *,
            passenger:passengers(name, phone)
          `)
          .eq('driver_id', driver.id)
          .in('status', ['accepted', 'in_progress'])
          .maybeSingle();

        if (activeError) throw activeError;
        setActiveRide(active);
      } catch (error: any) {
        console.error('Error fetching rides:', error);
      }
    };

    fetchRides();

    // Set up real-time updates
    const channel = supabase
      .channel('driver-rides')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides'
        },
        () => {
          fetchRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driver]);

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

  const toggleAvailability = async (isAvailable: boolean) => {
    if (!driver) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_available: isAvailable })
        .eq('id', driver.id);

      if (error) throw error;

      setDriver({ ...driver, is_available: isAvailable });
      
      toast({
        title: isAvailable ? "You're now online" : "You're now offline",
        description: isAvailable ? "You can now receive ride requests" : "You won't receive new ride requests",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const acceptRide = async (rideId: string) => {
    if (!driver) return;

    try {
      const { error } = await supabase
        .from('rides')
        .update({ 
          driver_id: driver.id,
          status: 'accepted' 
        })
        .eq('id', rideId);

      if (error) throw error;

      toast({
        title: "Ride Accepted!",
        description: "You can now start the ride",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateRideStatus = async (rideId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status })
        .eq('id', rideId);

      if (error) throw error;

      toast({
        title: "Ride Updated",
        description: `Ride status changed to ${status}`,
      });
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
          <h1 className="text-xl font-bold gradient-hero bg-clip-text text-transparent">Driver Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {driver?.name || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Driver Status and Location Tracking */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Driver Status */}
          <Card className="gradient-card card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Driver Status
                </div>
                <Badge variant={driver?.is_available ? "default" : "secondary"}>
                  {driver?.is_available ? "Online" : "Offline"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Availability</p>
                  <p className="text-sm text-muted-foreground">
                    {driver?.is_available ? "You're receiving ride requests" : "You're not receiving requests"}
                  </p>
                </div>
                <Switch
                  checked={driver?.is_available || false}
                  onCheckedChange={toggleAvailability}
                />
              </div>
              
              {driver && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-medium">{driver.car_model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plate</p>
                    <p className="font-medium">{driver.car_plate}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Tracking */}
          <LocationTracker />
        </div>

        {/* Earnings Dashboard */}
        <EarningsDashboard />

        {/* Active Ride */}
        {activeRide && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Active Ride
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <p className="font-medium">Pickup</p>
                    <p className="text-sm text-muted-foreground">{activeRide.pickup_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Navigation className="h-5 w-5 text-red-500 mt-1" />
                  <div>
                    <p className="font-medium">Dropoff</p>
                    <p className="text-sm text-muted-foreground">{activeRide.dropoff_address}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">Passenger: {activeRide.passenger.name}</p>
                  <p className="text-sm text-muted-foreground">Fare: ${activeRide.estimated_fare}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/driver/chat/${activeRide.id}`)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                {activeRide.status === 'accepted' && (
                  <Button 
                    onClick={() => updateRideStatus(activeRide.id, 'in_progress')}
                    className="flex-1"
                  >
                    Start Ride
                  </Button>
                )}
                {activeRide.status === 'in_progress' && (
                  <Button 
                    onClick={() => updateRideStatus(activeRide.id, 'completed')}
                    className="flex-1"
                  >
                    Complete Ride
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Rides */}
        {!activeRide && pendingRides.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Available Rides ({pendingRides.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRides.map((ride) => (
                  <div key={ride.id} className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-green-500 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Pickup</p>
                          <p className="text-sm text-muted-foreground">{ride.pickup_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Navigation className="h-4 w-4 text-red-500 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Dropoff</p>
                          <p className="text-sm text-muted-foreground">{ride.dropoff_address}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">${ride.estimated_fare}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{ride.passenger.name}</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => acceptRide(ride.id)}
                        size="sm"
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Rides Available */}
        {!activeRide && pendingRides.length === 0 && driver?.is_available && (
          <Card>
            <CardContent className="text-center py-12">
              <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No rides available</h3>
              <p className="text-muted-foreground">
                You're online and ready to receive ride requests
              </p>
            </CardContent>
          </Card>
        )}

        {/* Driver Offline */}
        {!driver?.is_available && (
          <Card>
            <CardContent className="text-center py-12">
              <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">You're offline</h3>
              <p className="text-muted-foreground">
                Turn on availability to start receiving ride requests
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;