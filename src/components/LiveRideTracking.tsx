import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, Star, Clock, MapPin, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Map from './Map';

interface Driver {
  id: string;
  name: string;
  phone: string;
  car_model: string;
  car_plate: string;
  rating: number;
  photo_url?: string;
}

interface Ride {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_fare: number;
  final_fare?: number;
  driver_id: string;
  created_at: string;
  pickup_location: [number, number];
  dropoff_location: [number, number];
}

interface LiveRideTrackingProps {
  ride: Ride;
  driver: Driver;
  onRideUpdate?: (ride: Ride) => void;
}

const LiveRideTracking: React.FC<LiveRideTrackingProps> = ({ 
  ride, 
  driver, 
  onRideUpdate 
}) => {
  const [estimatedArrival, setEstimatedArrival] = useState<number>(0);
  const [rideStatus, setRideStatus] = useState(ride.status);

  // Subscribe to ride updates
  useEffect(() => {
    const channel = supabase
      .channel('ride-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${ride.id}`
        },
        (payload) => {
          const updatedRide = payload.new as Ride;
          setRideStatus(updatedRide.status);
          onRideUpdate?.(updatedRide);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ride.id, onRideUpdate]);

  // Calculate estimated arrival based on driver location
  useEffect(() => {
    const calculateArrival = async () => {
      try {
        const { data } = await supabase
          .from('driver_locations')
          .select('location')
          .eq('driver_id', driver.id)
          .eq('is_active', true)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          // Simple calculation - in reality you'd use routing APIs
          const driverLat = data.location[1];
          const driverLng = data.location[0];
          const pickupLat = ride.pickup_location[1];
          const pickupLng = ride.pickup_location[0];
          
          const distance = Math.sqrt(
            Math.pow(driverLat - pickupLat, 2) + Math.pow(driverLng - pickupLng, 2)
          ) * 111; // Rough conversion to km
          
          // Assume 30 km/h average speed
          setEstimatedArrival(Math.round((distance / 30) * 60));
        }
      } catch (error) {
        console.error('Error calculating arrival:', error);
      }
    };

    if (rideStatus === 'accepted') {
      calculateArrival();
      const interval = setInterval(calculateArrival, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [driver.id, ride.pickup_location, rideStatus]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Finding Driver', variant: 'secondary' as const, color: 'text-yellow-600' },
      accepted: { label: 'Driver On Way', variant: 'default' as const, color: 'text-blue-600' },
      in_progress: { label: 'In Progress', variant: 'default' as const, color: 'text-green-600' },
      completed: { label: 'Completed', variant: 'secondary' as const, color: 'text-green-600' },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const, color: 'text-red-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} RWF`;
  };

  return (
    <div className="space-y-6">
      {/* Ride Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Your Ride
            </CardTitle>
            {getStatusBadge(rideStatus)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pickup:</span>
              <span className="text-sm font-medium">{ride.pickup_address}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Dropoff:</span>
              <span className="text-sm font-medium">{ride.dropoff_address}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Fare:</span>
              <span className="text-sm font-medium">
                {formatCurrency(ride.final_fare || ride.estimated_fare)}
              </span>
            </div>
            {rideStatus === 'accepted' && estimatedArrival > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Arrival:</span>
                <span className="text-sm font-medium text-primary">
                  {estimatedArrival} minutes
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Driver Details */}
      {rideStatus !== 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              {driver.photo_url ? (
                <img 
                  src={driver.photo_url} 
                  alt={driver.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Car className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{driver.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {driver.car_model} • {driver.car_plate}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{driver.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Map */}
      <Card>
        <CardContent className="p-0">
          <Map
            pickupLocation={{
              lat: ride.pickup_location[1],
              lng: ride.pickup_location[0],
              address: ride.pickup_address
            }}
            dropoffLocation={{
              lat: ride.dropoff_location[1],
              lng: ride.dropoff_location[0],
              address: ride.dropoff_address
            }}
            assignedDriverId={driver.id}
            showAllDrivers={false}
            className="h-80"
          />
        </CardContent>
      </Card>

      {/* Real-time Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Live Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {rideStatus === 'pending' && (
              <p className="text-muted-foreground">🔍 Finding the best driver for you...</p>
            )}
            {rideStatus === 'accepted' && (
              <>
                <p className="text-blue-600">✅ Driver confirmed! Heading to pickup location</p>
                <p className="text-muted-foreground">📍 Live location tracking active</p>
              </>
            )}
            {rideStatus === 'in_progress' && (
              <p className="text-green-600">🚗 Ride in progress to destination</p>
            )}
            {rideStatus === 'completed' && (
              <p className="text-green-600">🎉 Ride completed successfully!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveRideTracking;