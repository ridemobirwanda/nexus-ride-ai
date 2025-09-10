import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import LiveDriverMap from '@/components/LiveDriverMap';
import { LogOut } from 'lucide-react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import Map from '@/components/Map';
import CarCategorySelector from '@/components/CarCategorySelector';
import SeatFilterSelector from '@/components/SeatFilterSelector';
import RideBookingCard from '@/components/RideBookingCard';
import QuickActionsGrid from '@/components/QuickActionsGrid';

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
    selectedCarCategory: null as any,
    selectedSeats: [] as number[]
  });

  // Auth state listener - Allow browsing without auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // Don't redirect - allow browsing
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Don't redirect - allow browsing
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
          <>
            <SeatFilterSelector
              selectedSeats={rideData.selectedSeats}
              onSeatChange={(seats) => setRideData({ ...rideData, selectedSeats: seats })}
            />
            
            <CarCategorySelector
              selectedCategoryId={rideData.selectedCarCategory?.id}
              onCategorySelect={(category) => setRideData({ ...rideData, selectedCarCategory: category })}
              showPricing={true}
              distance={calculateDistance()}
              seatFilter={rideData.selectedSeats}
            />
          </>
        )}

        {/* Ride Booking */}
        <RideBookingCard
          passenger={passenger}
          currentRide={currentRide}
          rideData={rideData}
          setRideData={setRideData}
        />

        {/* Live Drivers Map */}
        <LiveDriverMap className="mb-6" />

        {/* Quick Actions */}
        <QuickActionsGrid />
      </div>
    </div>
  );
};

export default PassengerDashboard;