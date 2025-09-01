import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Car, 
  Users, 
  Fuel, 
  Calendar, 
  MapPin, 
  Search,
  Filter,
  Star,
  Clock,
  DollarSign
} from 'lucide-react';

interface RentalCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  car_type: string;
  seating_capacity: number;
  fuel_type: string;
  price_per_day: number;
  price_per_hour: number;
  description: string;
  features: string[];
  availability_status: string;
  location_address: string;
  primary_image?: string;
}

const CarRentals = () => {
  const [cars, setCars] = useState<RentalCar[]>([]);
  const [filteredCars, setFilteredCars] = useState<RentalCar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFuelType, setSelectedFuelType] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    filterCars();
  }, [cars, searchTerm, selectedType, selectedFuelType, priceRange]);

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_cars')
        .select(`
          *,
          rental_car_images!inner(image_url)
        `)
        .eq('is_active', true)
        .eq('availability_status', 'available')
        .eq('rental_car_images.is_primary', true)
        .order('car_type', { ascending: true });

      if (error) throw error;

      const carsWithImages = (data || []).map(car => ({
        ...car,
        features: Array.isArray(car.features) ? car.features.map(f => String(f)) : [],
        primary_image: car.rental_car_images?.[0]?.image_url || '/placeholder.svg'
      }));

      setCars(carsWithImages);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load rental cars",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterCars = () => {
    let filtered = cars.filter(car => {
      const matchesSearch = 
        car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.car_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || car.car_type === selectedType;
      const matchesFuel = selectedFuelType === 'all' || car.fuel_type === selectedFuelType;
      
      let matchesPrice = true;
      if (priceRange !== 'all') {
        const dailyPrice = car.price_per_day;
        switch (priceRange) {
          case 'budget':
            matchesPrice = dailyPrice <= 10000;
            break;
          case 'mid':
            matchesPrice = dailyPrice > 10000 && dailyPrice <= 20000;
            break;
          case 'luxury':
            matchesPrice = dailyPrice > 20000;
            break;
        }
      }

      return matchesSearch && matchesType && matchesFuel && matchesPrice;
    });

    setFilteredCars(filtered);
  };

  const getCarTypes = () => {
    const types = [...new Set(cars.map(car => car.car_type))];
    return types;
  };

  const getFuelTypes = () => {
    const fuelTypes = [...new Set(cars.map(car => car.fuel_type))];
    return fuelTypes;
  };

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString()} RWF`;
  };

  const getTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('suv')) return '🚙';
    if (type.toLowerCase().includes('sedan')) return '🚗';
    if (type.toLowerCase().includes('luxury')) return '🏎️';
    if (type.toLowerCase().includes('compact')) return '🚕';
    if (type.toLowerCase().includes('electric')) return '⚡';
    return '🚗';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Car className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-2xl font-semibold mb-2">Loading Cars...</h2>
            <p className="text-muted-foreground">Finding the perfect rental for you</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🚗 Car Rentals</h1>
          <p className="text-xl text-muted-foreground">
            Choose from our premium fleet of vehicles for your perfect journey
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Find Your Perfect Car
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cars..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Car Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Car Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getCarTypes().map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Fuel Type Filter */}
              <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                <SelectTrigger>
                  <SelectValue placeholder="Fuel Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fuel Types</SelectItem>
                  {getFuelTypes().map(fuel => (
                    <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range Filter */}
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="budget">Budget (≤10,000 RWF)</SelectItem>
                  <SelectItem value="mid">Mid-range (10,001-20,000 RWF)</SelectItem>
                  <SelectItem value="luxury">Luxury (&gt;20,000 RWF)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredCars.length} car{filteredCars.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Car Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <Card 
              key={car.id} 
              className="gradient-card card-shadow hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/cars/${car.id}`)}
            >
              <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-lg h-48">
                  <img
                    src={car.primary_image}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/90 text-primary hover:bg-white">
                      {car.availability_status.charAt(0).toUpperCase() + car.availability_status.slice(1)}
                    </Badge>
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-black/70 text-white">
                      {getTypeIcon(car.car_type)} {car.car_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Car Info */}
                  <div>
                    <h3 className="text-xl font-bold">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-muted-foreground">{car.year}</p>
                  </div>

                  {/* Features */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{car.seating_capacity} seats</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="h-4 w-4" />
                      <span>{car.fuel_type}</span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{car.location_address}</span>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(car.price_per_day)}
                        </span>
                        <span className="text-sm text-muted-foreground">/day</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatPrice(car.price_per_hour)}/hour
                      </div>
                    </div>
                    
                    <Button 
                      className="gradient-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/cars/${car.id}/book`);
                      }}
                    >
                      Rent Now
                    </Button>
                  </div>

                  {/* Quick Features */}
                  <div className="flex flex-wrap gap-1">
                    {car.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {car.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{car.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredCars.length === 0 && (
          <div className="text-center py-12">
            <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No cars found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more options
            </p>
            <Button 
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSelectedFuelType('all');
                setPriceRange('all');
              }}
              className="mt-4"
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-muted-foreground"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CarRentals;