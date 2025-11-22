import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import LocationTracker from '@/components/LocationTracker';
import DriverStatusPanel from '@/components/DriverStatusPanel';
import { 
  Car, 
  DollarSign, 
  Clock, 
  User, 
  LogOut, 
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Settings
} from 'lucide-react';
import DriverCarSetup from '@/components/DriverCarSetup';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface Driver {
  id: string;
  name: string;
  phone: string;
  car_model: string;
  car_plate: string;
  is_available: boolean;
  current_location?: any; // PostgreSQL point type
}

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_location: any; // PostgreSQL point type
  dropoff_location: any;
  status: string;
  estimated_fare: number;
  distance_km: number;
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
  const [showCarSetup, setShowCarSetup] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { vibrateNewRide } = useHapticFeedback();

  // Auth state listener with driver verification
  useEffect(() => {
    let isMounted = true;

    const handleAuth = async (session: any) => {
      if (!isMounted) return;
      
      console.log('Auth session:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        console.log('No session, redirecting to auth');
        setIsLoading(false);
        navigate('/driver/auth');
        return;
      }

      // Verify user is a driver
      try {
        const { data: isDriverUser, error } = await supabase.rpc('is_driver', {
          user_id: session.user.id
        });
        
        console.log('Driver verification result:', { isDriverUser, error });
        
        if (error) {
          console.error('Error verifying driver status:', error);
          toast({
            title: t('toast.authError'), 
            description: t('toast.verifyAccessError'),
            variant: "destructive"
          });
          setIsLoading(false);
          navigate('/driver/auth');
          return;
        }
        
        if (!isDriverUser) {
          toast({
            title: t('toast.accessDenied'),
            description: t('toast.needDriverAccount'),
            variant: "destructive"
          });
          setIsLoading(false);
          navigate('/driver/auth');
          return;
        }
        
        // If we get here, user is verified as a driver
        console.log('User verified as driver');
      } catch (error: any) {
        console.error('Driver verification error:', error);
        setIsLoading(false);
        navigate('/driver/auth');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        await handleAuth(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check');
      await handleAuth(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
        console.error('Driver profile fetch error:', error);
        
        // If driver profile doesn't exist, show helpful message
        if (error.message?.includes('No driver profile found')) {
          toast({
            title: "Profile Setup Required",
            description: "Please complete your driver registration first.",
            variant: "destructive"
          });
          setShowCarSetup(true);
        } else {
          toast({
            title: "Error Loading Profile",
            description: error.message || "Unable to load driver profile",
            variant: "destructive"
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverProfile();
  }, [user]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate ETA in minutes (assuming average speed of 30 km/h in city)
  const calculateETA = (distanceKm: number): number => {
    return Math.round((distanceKm / 30) * 60);
  };

  // Fetch pending rides and active ride
  useEffect(() => {
    const fetchRides = async () => {
      if (!driver) return;

      try {
        // Fetch pending rides with location data
        const { data: pending, error: pendingError } = await supabase
          .from('rides')
          .select(`
            *,
            passenger:passengers(name, phone)
          `)
          .eq('status', 'pending')
          .limit(10);

        if (pendingError) throw pendingError;
        
        // Trigger haptic feedback for new ride requests
        if (pending && pending.length > pendingRides.length && pendingRides.length > 0) {
          vibrateNewRide();
          toast({
            title: "New Ride Request!",
            description: "You have a new ride request",
          });
        }
        
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
    <div className="min-h-screen rider-bg pb-safe">
      {/* Header - Mobile Optimized */}
      <header className="bg-card/80 backdrop-blur-lg border-b px-4 py-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold gradient-hero bg-clip-text text-transparent`}>
            Driver Dashboard
          </h1>
          <div className="flex items-center gap-2 md:gap-4">
            {!isMobile && (
              <span className="text-sm text-muted-foreground">
                {driver?.name || user?.email}
              </span>
            )}
            <Button 
              variant="ghost" 
              size={isMobile ? "lg" : "sm"}
              onClick={handleSignOut}
              className={isMobile ? "min-h-[44px] min-w-[44px]" : ""}
            >
              <LogOut className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            </Button>
          </div>
        </div>
      </header>

      <div className={`container mx-auto ${isMobile ? 'px-3 py-4' : 'px-4 py-6'} space-y-4 md:space-y-6`}>
        {/* Car Setup or Driver Status */}
        {showCarSetup ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Vehicle Setup</h2>
              <Button variant="outline" onClick={() => setShowCarSetup(false)}>
                Back to Dashboard
              </Button>
            </div>
            {driver && <DriverCarSetup driverId={driver.id} />}
          </div>
        ) : (
          <>
            {/* Driver Status and Location Tracking - Mobile Optimized */}
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'lg:grid-cols-2 gap-6'}`}>
              {/* Enhanced Driver Status */}
              {driver && (
                <DriverStatusPanel 
                  driverId={driver.id} 
                  onManageVehicle={() => setShowCarSetup(true)}
                  driverData={{
                    car_model: driver.car_model,
                    car_plate: driver.car_plate
                  }}
                  isMobile={isMobile}
                />
              )}

              {/* Location Tracking */}
              <LocationTracker />
            </div>

        {/* Active Ride - Mobile Optimized */}
        {activeRide && (
          <Card className="border-primary">
            <CardHeader className={isMobile ? "pb-3" : ""}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                <Navigation className={isMobile ? "h-6 w-6" : "h-5 w-5"} />
                Active Ride
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "space-y-3" : "space-y-4"}>
              <div className={isMobile ? "space-y-3" : "space-y-3"}>
                <div className="flex items-start gap-3">
                  <MapPin className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-green-500 mt-1 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${isMobile ? 'text-base' : ''}`}>Pickup</p>
                    <p className={`${isMobile ? 'text-base' : 'text-sm'} text-muted-foreground break-words`}>
                      {activeRide.pickup_address}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Navigation className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-red-500 mt-1 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${isMobile ? 'text-base' : ''}`}>Dropoff</p>
                    <p className={`${isMobile ? 'text-base' : 'text-sm'} text-muted-foreground break-words`}>
                      {activeRide.dropoff_address}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${isMobile ? 'flex-col space-y-3' : 'flex items-center justify-between'} pt-4 border-t`}>
                <div>
                  <p className={`font-medium ${isMobile ? 'text-base mb-1' : ''}`}>
                    Passenger: {activeRide.passenger.name}
                  </p>
                  <p className={`${isMobile ? 'text-base' : 'text-sm'} text-muted-foreground`}>
                    Fare: ${activeRide.estimated_fare}
                  </p>
                </div>
                <div className={`flex ${isMobile ? 'gap-3' : 'gap-2'} ${isMobile ? 'w-full' : ''}`}>
                  <Button 
                    variant="outline" 
                    size={isMobile ? "lg" : "sm"}
                    onClick={() => window.open(`tel:${activeRide.passenger.phone}`, '_self')}
                    title={`Call ${activeRide.passenger.name}`}
                    className={isMobile ? "flex-1 min-h-[48px]" : ""}
                  >
                    <Phone className={isMobile ? "h-5 w-5 mr-2" : "h-4 w-4"} />
                    {isMobile && "Call"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size={isMobile ? "lg" : "sm"}
                    onClick={() => navigate(`/driver/chat/${activeRide.id}`)}
                    className={isMobile ? "flex-1 min-h-[48px]" : ""}
                  >
                    <MessageCircle className={isMobile ? "h-5 w-5 mr-2" : "h-4 w-4"} />
                    {isMobile && "Chat"}
                  </Button>
                </div>
              </div>

              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-2'}`}>
                {activeRide.status === 'accepted' && (
                  <Button 
                    onClick={() => updateRideStatus(activeRide.id, 'in_progress')}
                    className={`flex-1 ${isMobile ? 'min-h-[52px] text-base' : ''}`}
                    size={isMobile ? "lg" : "default"}
                  >
                    Start Ride
                  </Button>
                )}
                {activeRide.status === 'in_progress' && (
                  <Button 
                    onClick={() => updateRideStatus(activeRide.id, 'completed')}
                    className={`flex-1 ${isMobile ? 'min-h-[52px] text-base' : ''}`}
                    size={isMobile ? "lg" : "default"}
                  >
                    Complete Ride
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Rides - Mobile Optimized */}
        {!activeRide && pendingRides.length > 0 && (
          <Card>
            <CardHeader className={isMobile ? "pb-3" : ""}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                <Clock className={isMobile ? "h-6 w-6" : "h-5 w-5"} />
                Available Rides ({pendingRides.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={isMobile ? "space-y-3" : "space-y-4"}>
                {pendingRides.map((ride) => {
                  // Parse pickup location
                  let pickupLat = 0, pickupLng = 0;
                  if (ride.pickup_location) {
                    const match = ride.pickup_location.match(/\(([^,]+),([^)]+)\)/);
                    if (match) {
                      pickupLng = parseFloat(match[1]);
                      pickupLat = parseFloat(match[2]);
                    }
                  }

                  // Calculate distance and ETA to pickup location
                  let distanceToPickup = 0;
                  let etaMinutes = 0;
                  if (driver?.current_location && pickupLat && pickupLng) {
                    const driverMatch = driver.current_location.match(/\(([^,]+),([^)]+)\)/);
                    if (driverMatch) {
                      const driverLng = parseFloat(driverMatch[1]);
                      const driverLat = parseFloat(driverMatch[2]);
                      distanceToPickup = calculateDistance(driverLat, driverLng, pickupLat, pickupLng);
                      etaMinutes = calculateETA(distanceToPickup);
                    }
                  }

                  return (
                    <div 
                      key={ride.id} 
                      className={`${isMobile ? 'p-4' : 'p-4'} bg-muted/30 rounded-lg ${isMobile ? 'space-y-3' : 'space-y-4'} border border-border/50 hover:border-primary/50 transition-colors`}
                    >
                      {/* Distance and ETA Badge - Mobile Optimized */}
                      {distanceToPickup > 0 && (
                        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
                          <Badge variant="outline" className={`${isMobile ? 'text-sm w-fit' : 'text-xs'} gap-1.5`}>
                            <Navigation className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
                            {distanceToPickup.toFixed(1)} km away
                          </Badge>
                          <Badge variant="secondary" className={`${isMobile ? 'text-sm w-fit' : 'text-xs'} gap-1.5`}>
                            <Clock className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
                            ~{etaMinutes} min to pickup
                          </Badge>
                        </div>
                      )}

                      {/* Passenger Info - Mobile Optimized */}
                      <div className={`flex items-center gap-3 ${isMobile ? 'pb-3' : 'pb-3'} border-b`}>
                        <div className={`${isMobile ? 'h-12 w-12' : 'h-10 w-10'} rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0`}>
                          <User className={isMobile ? "h-6 w-6 text-primary" : "h-5 w-5 text-primary"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold`}>{ride.passenger.name}</p>
                          <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>{ride.passenger.phone}</p>
                        </div>
                      </div>

                      {/* Locations - Mobile Optimized */}
                      <div className={isMobile ? "space-y-3" : "space-y-3"}>
                        <div className="flex items-start gap-3">
                          <MapPin className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-green-500 mt-0.5 flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium text-muted-foreground mb-0.5`}>PICKUP LOCATION</p>
                            <p className={`${isMobile ? 'text-base' : 'text-sm'} font-medium leading-tight break-words`}>{ride.pickup_address}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Navigation className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-destructive mt-0.5 flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium text-muted-foreground mb-0.5`}>DROPOFF LOCATION</p>
                            <p className={`${isMobile ? 'text-base' : 'text-sm'} leading-tight break-words`}>{ride.dropoff_address}</p>
                          </div>
                        </div>
                      </div>

                      {/* Trip Details - Mobile Optimized */}
                      <div className={`flex items-center gap-4 ${isMobile ? 'text-base' : 'text-sm'}`}>
                        <div className="flex items-center gap-1.5">
                          <Car className={isMobile ? "h-5 w-5 text-muted-foreground" : "h-4 w-4 text-muted-foreground"} />
                          <span>{ride.distance_km?.toFixed(1) || 'N/A'} km</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className={isMobile ? "h-5 w-5 text-muted-foreground" : "h-4 w-4 text-muted-foreground"} />
                          <span className="font-semibold">${ride.estimated_fare?.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Actions - Mobile Optimized */}
                      <div className={`flex ${isMobile ? 'gap-3' : 'gap-2'} pt-2`}>
                        <Button 
                          onClick={() => acceptRide(ride.id)}
                          className={`flex-1 ${isMobile ? 'min-h-[52px] text-base' : ''}`}
                          size={isMobile ? "lg" : "lg"}
                        >
                          <Navigation className={isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2"} />
                          {isMobile ? "Accept Ride" : "Accept & Start Navigation"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size={isMobile ? "lg" : "lg"}
                          onClick={() => window.open(`tel:${ride.passenger.phone}`, '_self')}
                          className={isMobile ? "min-h-[52px] min-w-[52px]" : ""}
                        >
                          <Phone className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Rides Available - Mobile Optimized */}
        {!activeRide && pendingRides.length === 0 && driver?.is_available && (
          <Card>
            <CardContent className={`text-center ${isMobile ? 'py-10' : 'py-12'}`}>
              <Car className={`${isMobile ? 'h-16 w-16' : 'h-12 w-12'} mx-auto mb-4 text-muted-foreground`} />
              <h3 className={`${isMobile ? 'text-xl' : 'text-lg'} font-medium mb-2`}>No rides available</h3>
              <p className={`${isMobile ? 'text-base' : 'text-sm'} text-muted-foreground`}>
                You're online and ready to receive ride requests
              </p>
            </CardContent>
          </Card>
        )}

        {/* Driver Offline - Mobile Optimized */}
        {!driver?.is_available && (
          <Card>
            <CardContent className={`text-center ${isMobile ? 'py-10' : 'py-12'}`}>
              <Car className={`${isMobile ? 'h-16 w-16' : 'h-12 w-12'} mx-auto mb-4 text-muted-foreground`} />
              <h3 className={`${isMobile ? 'text-xl' : 'text-lg'} font-medium mb-2`}>You're offline</h3>
              <p className={`${isMobile ? 'text-base' : 'text-sm'} text-muted-foreground`}>
                Turn on availability to start receiving ride requests
              </p>
            </CardContent>
          </Card>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;