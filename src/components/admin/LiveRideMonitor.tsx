import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Clock, DollarSign, Car, Users } from 'lucide-react';
import Map from '../Map';

interface LiveRide {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_fare: number;
  created_at: string;
  pickup_location: [number, number];
  dropoff_location: [number, number];
  passenger: {
    name: string;
    phone: string;
  };
  driver?: {
    id: string;
    name: string;
    car_model: string;
    car_plate: string;
  };
}

interface LiveRideMonitorProps {
  userRole: string | null;
}

const LiveRideMonitor: React.FC<LiveRideMonitorProps> = ({ userRole }) => {
  const [liveRides, setLiveRides] = useState<LiveRide[]>([]);
  const [selectedRide, setSelectedRide] = useState<LiveRide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveRides();
    
    // Subscribe to real-time ride updates
    const channel = supabase
      .channel('admin-ride-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides'
        },
        () => {
          fetchLiveRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLiveRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          id,
          status,
          pickup_address,
          dropoff_address,
          estimated_fare,
          created_at,
          pickup_location,
          dropoff_location,
          passenger_id,
          driver_id,
          passengers!inner(name, phone),
          drivers(id, name, car_model, car_plate)
        `)
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRides = data.map((ride: any) => ({
        id: ride.id,
        status: ride.status,
        pickup_address: ride.pickup_address,
        dropoff_address: ride.dropoff_address,
        estimated_fare: ride.estimated_fare,
        created_at: ride.created_at,
        pickup_location: [
          parseFloat(ride.pickup_location.split(',')[0].replace('(', '')),
          parseFloat(ride.pickup_location.split(',')[1].replace(')', ''))
        ] as [number, number],
        dropoff_location: [
          parseFloat(ride.dropoff_location.split(',')[0].replace('(', '')),
          parseFloat(ride.dropoff_location.split(',')[1].replace(')', ''))
        ] as [number, number],
        passenger: ride.passengers,
        driver: ride.drivers
      }));

      setLiveRides(formattedRides);
    } catch (error) {
      console.error('Error fetching live rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} RWF`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {liveRides.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">
                  {liveRides.filter(r => r.status === 'accepted').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">
                  {liveRides.filter(r => r.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(liveRides.reduce((sum, ride) => sum + ride.estimated_fare, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Rides List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Live Rides ({liveRides.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {liveRides.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No active rides at the moment
              </p>
            ) : (
              liveRides.map((ride) => (
                <div
                  key={ride.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRide?.id === ride.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedRide(ride)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(ride.status)}>
                          {ride.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(ride.created_at)}
                        </span>
                      </div>
                      <h4 className="font-medium">{ride.passenger.name}</h4>
                      <p className="text-sm text-muted-foreground">{ride.passenger.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(ride.estimated_fare)}</p>
                      {ride.driver && (
                        <p className="text-xs text-muted-foreground">
                          {ride.driver.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-green-500" />
                      <span className="truncate">{ride.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-red-500" />
                      <span className="truncate">{ride.dropoff_address}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Live Map */}
        <Card>
          <CardHeader>
            <CardTitle>Live Tracking</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedRide ? (
              <Map
                pickupLocation={{
                  lat: selectedRide.pickup_location[1],
                  lng: selectedRide.pickup_location[0],
                  address: selectedRide.pickup_address
                }}
                dropoffLocation={{
                  lat: selectedRide.dropoff_location[1],
                  lng: selectedRide.dropoff_location[0],
                  address: selectedRide.dropoff_address
                }}
                assignedDriverId={selectedRide.driver?.id}
                showAllDrivers={false}
                className="h-96"
              />
            ) : (
              <Map
                showAllDrivers={true}
                className="h-96"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Ride Details */}
      {selectedRide && (
        <Card>
          <CardHeader>
            <CardTitle>Ride Details - {selectedRide.id.slice(0, 8)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Passenger Information</h4>
                  <p><strong>Name:</strong> {selectedRide.passenger.name}</p>
                  <p><strong>Phone:</strong> {selectedRide.passenger.phone}</p>
                </div>
                
                {selectedRide.driver && (
                  <div>
                    <h4 className="font-medium mb-2">Driver Information</h4>
                    <p><strong>Name:</strong> {selectedRide.driver.name}</p>
                    <p><strong>Vehicle:</strong> {selectedRide.driver.car_model}</p>
                    <p><strong>Plate:</strong> {selectedRide.driver.car_plate}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Trip Information</h4>
                  <p><strong>Status:</strong> 
                    <Badge className={`ml-2 ${getStatusColor(selectedRide.status)}`}>
                      {selectedRide.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </p>
                  <p><strong>Fare:</strong> {formatCurrency(selectedRide.estimated_fare)}</p>
                  <p><strong>Booked:</strong> {new Date(selectedRide.created_at).toLocaleString()}</p>
                </div>
                
                {userRole === 'super_admin' && (
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      Contact Passenger
                    </Button>
                    {selectedRide.driver && (
                      <Button variant="outline" size="sm">
                        Contact Driver
                      </Button>
                    )}
                    <Button variant="destructive" size="sm">
                      Cancel Ride
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveRideMonitor;