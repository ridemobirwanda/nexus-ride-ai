import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  Clock, 
  DollarSign,
  Star,
  Search,
  Car,
  MoreVertical
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  estimated_fare: number;
  final_fare?: number;
  distance_km?: number;
  duration_minutes?: number;
  rating?: number;
  payment_method?: string;
  created_at: string;
  driver?: {
    id: string;
    name: string;
    car_model: string;
    car_plate: string;
  };
}

const PassengerHistory = () => {
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRideHistory();
  }, []);

  useEffect(() => {
    filterRides();
  }, [rides, searchTerm, statusFilter]);

  const fetchRideHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: passengerData } = await supabase
        .from('passengers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!passengerData) return;

      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:drivers(*)
        `)
        .eq('passenger_id', passengerData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRides(data || []);
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

  const filterRides = () => {
    let filtered = rides;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ride => ride.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(ride => 
        ride.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ride.dropoff_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ride.driver?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRides(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'in_progress': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{rating}</span>
      </div>
    );
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
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/passenger/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Ride History</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by location or driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {['all', 'completed', 'cancelled', 'in_progress'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ride List */}
        {filteredRides.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No rides found</h3>
              <p className="text-muted-foreground mb-4">
                {rides.length === 0 
                  ? "You haven't taken any rides yet"
                  : "No rides match your search criteria"
                }
              </p>
              {rides.length === 0 && (
                <Button onClick={() => navigate('/passenger/dashboard')}>
                  Book Your First Ride
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRides.map((ride) => (
              <Card key={ride.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(ride.status)} text-white text-xs`}>
                        {ride.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(ride.created_at)}
                      </span>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/passenger/ride/${ride.id}`)}
                        >
                          View Details
                        </DropdownMenuItem>
                        {ride.status === 'completed' && !ride.rating && (
                          <DropdownMenuItem
                            onClick={() => navigate(`/passenger/rate/${ride.id}`)}
                          >
                            Rate Ride
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <p className="text-sm line-clamp-1">{ride.pickup_address}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                      <p className="text-sm line-clamp-1">{ride.dropoff_address}</p>
                    </div>
                    {ride.payment_method && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Payment: {ride.payment_method.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>

                  {ride.driver && (
                    <div className="mb-3 p-2 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium">{ride.driver.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ride.driver.car_model} • {ride.driver.car_plate}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {ride.distance_km && (
                        <div className="flex items-center gap-1">
                          <span>{ride.distance_km}km</span>
                        </div>
                      )}
                      {ride.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(ride.duration_minutes)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {renderStars(ride.rating)}
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <DollarSign className="h-4 w-4" />
                        <span>{ride.final_fare || ride.estimated_fare}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerHistory;