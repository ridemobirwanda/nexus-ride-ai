import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Map from '@/components/Map';
import { 
  ArrowLeft,
  Car, 
  Clock, 
  MapPin,
  Phone,
  Navigation,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface RentalDetails {
  id: string;
  status: string;
  rental_start: string;
  rental_end: string;
  total_price: number;
  pickup_location: string;
  return_location: string;
  contact_phone: string;
  car: {
    brand: string;
    model: string;
    year: number;
    car_type: string;
    location_address: string;
  };
  current_location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

const RentalTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rental, setRental] = useState<RentalDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);

  useEffect(() => {
    if (id) {
      fetchRentalDetails();
      
      // Set up real-time location tracking
      const channel = supabase
        .channel(`rental_tracking_${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'rental_locations',
            filter: `rental_id=eq.${id}`
          },
          (payload) => {
            setCurrentLocation({
              lat: payload.new.latitude,
              lng: payload.new.longitude
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const fetchRentalDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('car_rentals')
        .select(`
          *,
          rental_cars!inner(
            brand,
            model,
            year,
            car_type,
            location_address
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const rentalData = {
        ...data,
        car: data.rental_cars
      };

      setRental(rentalData);

      // Fetch latest location
      const { data: locationData } = await supabase
        .from('rental_locations')
        .select('latitude, longitude, timestamp')
        .eq('rental_id', id)
        .eq('is_active', true)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (locationData) {
        setCurrentLocation({
          lat: locationData.latitude,
          lng: locationData.longitude
        });
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load rental details",
        variant: "destructive"
      });
      navigate('/passenger/rentals');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString()} RWF`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <h2 className="text-2xl font-semibold mb-2">Loading Rental Details...</h2>
        </div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Rental Not Found</h2>
          <Button onClick={() => navigate('/passenger/rentals')} variant="outline">
            ← Back to Rentals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/passenger/rentals')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Rentals
          </Button>
          <h1 className="text-3xl font-bold">Track Your Rental</h1>
          <Badge className={getStatusColor(rental.status)}>
            {getStatusIcon(rental.status)}
            <span className="ml-1">{rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map View */}
          <div className="lg:col-span-2">
            <Card className="h-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Live Vehicle Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {currentLocation ? (
                  <div className="h-80 rounded-b-lg overflow-hidden">
                    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">Live tracking map will be displayed here</p>
                        <p className="text-sm text-muted-foreground">
                          Location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center bg-muted rounded-b-lg">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {rental.status === 'active' 
                          ? 'Waiting for location update...' 
                          : 'Location tracking not active'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rental Timeline */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Rental Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Rental Confirmed</p>
                      <p className="text-sm text-muted-foreground">Booking has been confirmed</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${rental.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div>
                      <p className="font-medium">Vehicle Pickup</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(rental.rental_start)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${rental.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div>
                      <p className="font-medium">Vehicle Return</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(rental.rental_end)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rental Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Car Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Vehicle Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {rental.car.brand} {rental.car.model}
                    </h3>
                    <p className="text-muted-foreground">
                      {rental.car.year} • {rental.car.car_type}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Total Cost</span>
                      <span className="font-semibold">{formatPrice(rental.total_price)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Locations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Pickup Location</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rental.pickup_location}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Return Location</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rental.return_location}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact & Support */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      24/7 Customer Support
                    </p>
                    <Button variant="outline" className="w-full">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Support
                    </Button>
                  </div>
                  
                  {rental.status === 'active' && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          Rental Active
                        </span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Enjoy your ride! Return by {formatDateTime(rental.rental_end)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={className}>{children}</label>
);

export default RentalTracking;