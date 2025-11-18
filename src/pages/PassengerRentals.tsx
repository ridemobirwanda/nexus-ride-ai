import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Car, 
  Calendar, 
  MapPin,
  Clock,
  DollarSign,
  Eye,
  Navigation
} from 'lucide-react';

interface CarRental {
  id: string;
  status: string;
  rental_start: string;
  rental_end: string;
  total_price: number;
  pickup_location: string;
  return_location: string;
  car: {
    id: string;
    brand: string;
    model: string;
    year: number;
    car_type: string;
  };
}

const PassengerRentals = () => {
  const { t } = useTranslation();
  const [rentals, setRentals] = useState<CarRental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/passenger/auth');
        return;
      }

      const { data, error } = await supabase
        .from('car_rentals')
        .select(`
          *,
          rental_cars!inner(
            id,
            brand,
            model,
            year,
            car_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rentalsWithCars = (data || []).map(rental => ({
        ...rental,
        car: rental.rental_cars
      }));

      setRentals(rentalsWithCars);
    } catch (error: any) {
      toast({
        title: t('errors.loadFailed'),
        description: t('passengerRentals.errors.loadFailed'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString()} RWF`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredRentals = rentals.filter(rental => {
    if (filter === 'all') return true;
    return rental.status === filter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Car className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-2xl font-semibold mb-2">Loading Your Rentals...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Car Rentals</h1>
            <p className="text-muted-foreground">Manage your vehicle bookings and track active rentals</p>
          </div>
          <Button 
            onClick={() => navigate('/cars')}
            className="gradient-primary"
          >
            <Car className="h-4 w-4 mr-2" />
            Browse Cars
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className="text-sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Rentals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRentals.map((rental) => (
            <Card key={rental.id} className="gradient-card card-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">
                    {rental.car.brand} {rental.car.model}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {rental.car.year} • {rental.car.car_type}
                  </p>
                </div>
                <Badge className={getStatusColor(rental.status)}>
                  {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Rental Period */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Pickup:</span>
                    <span>{formatDateTime(rental.rental_start)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Return:</span>
                    <span>{formatDateTime(rental.rental_end)}</span>
                  </div>
                </div>

                {/* Locations */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="font-medium">Pickup:</span>
                      <p className="text-muted-foreground">{rental.pickup_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="font-medium">Return:</span>
                      <p className="text-muted-foreground">{rental.return_location}</p>
                    </div>
                  </div>
                </div>

                {/* Total Cost */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-medium">Total Cost</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(rental.total_price)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/cars/${rental.car.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Car
                  </Button>
                  
                  {rental.status === 'active' && (
                    <Button 
                      className="flex-1 gradient-primary"
                      onClick={() => navigate(`/rentals/${rental.id}/track`)}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Track Vehicle
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredRentals.length === 0 && (
          <div className="text-center py-12">
            <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {filter === 'all' ? 'No rentals yet' : `No ${filter} rentals`}
            </h3>
            <p className="text-muted-foreground mb-6">
              {filter === 'all' 
                ? "Start by browsing our available cars"
                : `You don't have any ${filter} rentals at the moment`
              }
            </p>
            {filter === 'all' && (
              <Button 
                onClick={() => navigate('/cars')}
                className="gradient-primary"
              >
                Browse Available Cars
              </Button>
            )}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/passenger')}
            className="text-muted-foreground"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PassengerRentals;