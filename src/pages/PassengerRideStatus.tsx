import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  Car, 
  MapPin, 
  Navigation,
  Clock,
  DollarSign,
  X
} from 'lucide-react';
import Map from '@/components/Map';

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_location: unknown;
  dropoff_location: unknown;
  status: string;
  estimated_fare: number;
  final_fare?: number;
  created_at: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
    car_model: string;
    car_plate: string;
    current_location?: unknown;
  };
}

const PassengerRideStatus = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRideDetails();
    
    // Set up real-time updates
    const channel = supabase
      .channel('ride-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`
        },
        (payload) => {
          setRide(prev => prev ? { ...prev, ...payload.new } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  const fetchRideDetails = async () => {
    if (!rideId) return;

    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:drivers(*)
        `)
        .eq('id', rideId)
        .single();

      if (error) throw error;
      setRide(data);
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

  const handleCancelRide = async () => {
    if (!ride || !['pending', 'accepted'].includes(ride.status)) return;

    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', rideId);

      if (error) throw error;

      toast({
        title: "Ride Cancelled",
        description: "Your ride has been cancelled successfully",
      });

      navigate('/passenger/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'in_progress': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Looking for Driver';
      case 'accepted': return 'Driver Assigned';
      case 'in_progress': return 'Ride in Progress';
      case 'completed': return 'Ride Completed';
      case 'cancelled': return 'Ride Cancelled';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ride Not Found</h2>
          <Button onClick={() => navigate('/passenger/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Parse location coordinates (simplified)
  const parseLocation = (locationStr: unknown) => {
    if (!locationStr || typeof locationStr !== 'string') return null;
    const coords = locationStr.match(/POINT\(([^)]+)\)/);
    if (!coords) return null;
    const [lng, lat] = coords[1].split(' ').map(Number);
    return { lat, lng };
  };

  const pickupCoords = parseLocation(ride.pickup_location);
  const dropoffCoords = parseLocation(ride.dropoff_location);
  const driverCoords = ride.driver?.current_location ? parseLocation(ride.driver.current_location) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/passenger/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">Ride Status</h1>
          </div>
          <Badge className={`${getStatusColor(ride.status)} text-white`}>
            {getStatusText(ride.status)}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Map */}
        <Card>
          <CardContent className="p-0">
            <Map
              pickupLocation={pickupCoords ? { ...pickupCoords, address: ride.pickup_address } : undefined}
              dropoffLocation={dropoffCoords ? { ...dropoffCoords, address: ride.dropoff_address } : undefined}
              drivers={driverCoords && ride.driver ? [{ 
                id: ride.driver.id, 
                ...driverCoords, 
                name: ride.driver.name 
              }] : []}
              className="h-80"
            />
          </CardContent>
        </Card>

        {/* Trip Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <p className="font-medium">Pickup</p>
                <p className="text-sm text-muted-foreground">{ride.pickup_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="h-5 w-5 text-red-500 mt-1" />
              <div>
                <p className="font-medium">Dropoff</p>
                <p className="text-sm text-muted-foreground">{ride.dropoff_address}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Fare</span>
              </div>
              <span className="text-lg font-bold text-primary">
                ${ride.final_fare || ride.estimated_fare}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Driver Info */}
        {ride.driver && (
          <Card>
            <CardHeader>
              <CardTitle>Driver Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback>{ride.driver.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{ride.driver.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {ride.driver.car_model} • {ride.driver.car_plate}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/passenger/chat/${rideId}`)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {['pending', 'accepted'].includes(ride.status) && (
          <Card>
            <CardContent className="p-4">
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleCancelRide}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Ride
              </Button>
            </CardContent>
          </Card>
        )}

        {ride.status === 'completed' && (
          <Card>
            <CardContent className="p-4">
              <Button 
                className="w-full"
                onClick={() => navigate(`/passenger/rate/${rideId}`)}
              >
                Rate Your Ride
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PassengerRideStatus;