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
  DollarSign,
  User,
  Hash
} from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface RentalCarImage {
  id: string;
  image_url: string;
  caption?: string;
  display_order: number;
  is_primary: boolean;
}

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
  plate_number?: string;
  owner_name?: string;
  owner_phone?: string;
  images: RentalCarImage[];
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
      // Fetch cars with all new fields
      const { data: carsData, error: carsError } = await supabase
        .from('rental_cars')
        .select('*')
        .eq('is_active', true)
        .eq('availability_status', 'available')
        .order('car_type', { ascending: true })
        .limit(50);

      if (carsError) throw carsError;

      // Fetch all images for each car
      const carIds = carsData?.map(car => car.id) || [];
      const { data: imagesData, error: imagesError } = await supabase
        .from('rental_car_images')
        .select('*')
        .in('car_id', carIds)
        .order('display_order', { ascending: true });

      if (imagesError) throw imagesError;

      // Group images by car_id
      const imagesByCarId = new Map<string, RentalCarImage[]>();
      imagesData?.forEach(img => {
        if (!imagesByCarId.has(img.car_id)) {
          imagesByCarId.set(img.car_id, []);
        }
        imagesByCarId.get(img.car_id)!.push(img);
      });
      
      const carsWithImages = (carsData || []).map(car => ({
        ...car,
        features: Array.isArray(car.features) ? car.features.map(f => String(f)) : [],
        images: imagesByCarId.get(car.id) || [{
          id: 'placeholder',
          image_url: '/placeholder.svg',
          display_order: 0,
          is_primary: true
        }]
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

        {/* Car Grid - Compact layout for 3 cards per column */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredCars.map((car) => (
            <Card 
              key={car.id} 
              className="gradient-card card-shadow hover:shadow-lg transition-all duration-300 cursor-pointer group h-fit"
              onClick={() => navigate(`/cars/${car.id}`)}
            >
              <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-lg h-32">
                  {car.images.length > 1 ? (
                    <Carousel className="w-full h-full">
                      <CarouselContent>
                        {car.images.map((image, index) => (
                          <CarouselItem key={image.id}>
                            <img
                              src={image.image_url}
                              alt={image.caption || `${car.brand} ${car.model} - Image ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-1 w-6 h-6 bg-white/80 hover:bg-white" />
                      <CarouselNext className="right-1 w-6 h-6 bg-white/80 hover:bg-white" />
                    </Carousel>
                  ) : (
                    <img
                      src={car.images[0]?.image_url || '/placeholder.svg'}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/90 text-primary hover:bg-white text-xs">
                      {car.availability_status.charAt(0).toUpperCase() + car.availability_status.slice(1)}
                    </Badge>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                      {getTypeIcon(car.car_type)}
                    </Badge>
                  </div>
                  {car.images.length > 1 && (
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                        {car.images.length}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-3">
                <div className="space-y-2">
                  {/* Car Info */}
                  <div>
                    <h3 className="text-sm font-bold truncate">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-xs text-muted-foreground">{car.year}</p>
                  </div>

                  {/* Compact Features */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{car.seating_capacity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="h-3 w-3" />
                      <span className="truncate">{car.fuel_type}</span>
                    </div>
                  </div>

                  {/* Location & Plate */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{car.location_address}</span>
                    </div>
                    
                    {car.plate_number && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        <span className="font-mono text-xs">{car.plate_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-primary" />
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(car.price_per_day)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPrice(car.price_per_hour)}/hr
                    </div>
                  </div>
                  
                  <Button 
                    className="gradient-primary w-full text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/cars/${car.id}/book`);
                    }}
                  >
                    Rent Now
                  </Button>
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