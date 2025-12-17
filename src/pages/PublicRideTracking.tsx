import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Navigation, Car, Clock, Shield, ArrowLeft } from 'lucide-react';
import Map from '@/components/Map';

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_location: unknown;
  dropoff_location: unknown;
  status: string;
  estimated_fare: number;
  created_at: string;
  driver?: {
    id: string;
    name: string;
    car_model: string;
    car_plate: string;
    current_location?: unknown;
  };
}

const PublicRideTracking = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rideId) {
      setError('Invalid ride ID');
      setIsLoading(false);
      return;
    }

    fetchRideDetails();
    
    // Set up real-time updates
    const channel = supabase
      .channel('public-ride-tracking')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`
        },
        () => {
          fetchRideDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  const fetchRideDetails = async () => {
    try {
      // Using a public-safe query that only returns necessary info
      const { data, error: fetchError } = await supabase
        .from('rides')
        .select(`
          id,
          pickup_address,
          dropoff_address,
          pickup_location,
          dropoff_location,
          status,
          estimated_fare,
          created_at,
          driver:drivers(id, name, car_model, car_plate, current_location)
        `)
        .eq('id', rideId)
        .single();

      if (fetchError) {
        setError('Ride not found or access denied');
        return;
      }

      setRide(data);
    } catch (err) {
      setError('Failed to load ride details');
    } finally {
      setIsLoading(false);
    }
  };

  const parseLocation = (locationStr: unknown) => {
    if (!locationStr || typeof locationStr !== 'string') return null;
    const coords = locationStr.match(/POINT\(([^)]+)\)/);
    if (!coords) {
      // Try parsing as (lng, lat) format
      const match = String(locationStr).match(/\(([^,]+),\s*([^)]+)\)/);
      if (match) {
        return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
      }
      return null;
    }
    const [lng, lat] = coords[1].split(' ').map(Number);
    return { lat, lng };
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Looking for Driver', color: 'bg-amber-500' };
      case 'accepted':
        return { text: 'Driver En Route', color: 'bg-blue-500' };
      case 'in_progress':
        return { text: 'Ride In Progress', color: 'bg-green-500' };
      case 'completed':
        return { text: 'Ride Completed', color: 'bg-gray-500' };
      case 'cancelled':
        return { text: 'Ride Cancelled', color: 'bg-red-500' };
      default:
        return { text: status, color: 'bg-gray-500' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ride Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'This ride link may have expired or is invalid.'}
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pickupCoords = parseLocation(ride.pickup_location);
  const dropoffCoords = parseLocation(ride.dropoff_location);
  const statusInfo = getStatusInfo(ride.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Live Ride Tracking</h1>
              <p className="text-xs text-muted-foreground">Shared ride view</p>
            </div>
          </div>
          <Badge className={`${statusInfo.color} text-white`}>
            {statusInfo.text}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-4 max-w-2xl">
        {/* Map */}
        <Card>
          <CardContent className="p-0">
            <Map
              pickupLocation={pickupCoords ? { ...pickupCoords, address: ride.pickup_address } : undefined}
              dropoffLocation={dropoffCoords ? { ...dropoffCoords, address: ride.dropoff_address } : undefined}
              assignedDriverId={ride.driver?.id}
              showAllDrivers={false}
              className="h-64 sm:h-80"
            />
          </CardContent>
        </Card>

        {/* Trip Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-5 w-5" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm">{ride.pickup_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Drop-off</p>
                <p className="text-sm">{ride.dropoff_address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Info */}
        {ride.driver && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Driver</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {ride.driver.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{ride.driver.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ride.driver.car_model} • {ride.driver.car_plate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Info */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Ride started: {new Date(ride.created_at).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PublicRideTracking;
