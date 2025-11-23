import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Car, 
  ArrowLeft, 
  Star, 
  MapPin, 
  Users, 
  Search,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CarCategory {
  id: string;
  name: string;
  description: string;
  base_fare: number;
  base_price_per_km: number;
  passenger_capacity: number;
  features: string[];
}

interface Driver {
  id: string;
  name: string;
  car_model: string;
  car_plate: string;
  car_year: number;
  car_color: string;
  bio: string;
  rating: number;
  total_trips: number;
  car_category?: CarCategory;
}

interface CarImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

interface CarVideo {
  id: string;
  video_url: string;
  is_primary: boolean;
}

interface VehicleWithMedia extends Driver {
  images: CarImage[];
  videos: CarVideo[];
}

const VehicleShowcase = () => {
  const [vehicles, setVehicles] = useState<VehicleWithMedia[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithMedia | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [searchQuery, vehicles]);

  const fetchVehicles = async () => {
    try {
      // Fetch drivers with their categories
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select(`
          id,
          name,
          car_model,
          car_plate,
          car_year,
          car_color,
          bio,
          rating,
          total_trips,
          car_category_id,
          car_categories (
            id,
            name,
            description,
            base_fare,
            base_price_per_km,
            passenger_capacity,
            features
          )
        `)
        .eq('is_available', true)
        .not('car_model', 'is', null)
        .order('rating', { ascending: false });

      if (driversError) throw driversError;

      // Fetch images and videos for each driver
      const vehiclesWithMedia = await Promise.all(
        (driversData || []).map(async (driver) => {
          const [imagesResult, videosResult] = await Promise.all([
            supabase
              .from('car_images')
              .select('*')
              .eq('driver_id', driver.id)
              .order('is_primary', { ascending: false }),
            supabase
              .from('car_videos')
              .select('*')
              .eq('driver_id', driver.id)
              .order('is_primary', { ascending: false })
          ]);

          return {
            ...driver,
            car_category: driver.car_categories as CarCategory,
            images: imagesResult.data || [],
            videos: videosResult.data || []
          };
        })
      );

      setVehicles(vehiclesWithMedia);
      setFilteredVehicles(vehiclesWithMedia);
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterVehicles = () => {
    if (!searchQuery.trim()) {
      setFilteredVehicles(vehicles);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = vehicles.filter(vehicle => 
      vehicle.car_model?.toLowerCase().includes(query) ||
      vehicle.car_color?.toLowerCase().includes(query) ||
      vehicle.name?.toLowerCase().includes(query) ||
      vehicle.car_category?.name?.toLowerCase().includes(query)
    );
    setFilteredVehicles(filtered);
  };

  const openGallery = (vehicle: VehicleWithMedia) => {
    setSelectedVehicle(vehicle);
    setIsGalleryOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen rider-bg flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 animate-bounce mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rider-bg pb-20">
      {/* Header */}
      <div className="gradient-header text-white p-6 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Vehicle Showcase</h1>
              <p className="text-sm text-white/90">Browse available driver vehicles</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by model, color, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {filteredVehicles.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No vehicles found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search criteria' : 'No available vehicles at the moment'}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <Card 
                key={vehicle.id} 
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => openGallery(vehicle)}
              >
                {/* Vehicle Image */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  {vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0].image_url}
                      alt={vehicle.car_model}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Media Count Badge */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {vehicle.images.length > 0 && (
                      <Badge className="bg-black/70 text-white">
                        {vehicle.images.length} 📷
                      </Badge>
                    )}
                    {vehicle.videos.length > 0 && (
                      <Badge className="bg-black/70 text-white">
                        {vehicle.videos.length} 🎥
                      </Badge>
                    )}
                  </div>

                  {/* Rating Badge */}
                  <Badge className="absolute bottom-2 left-2 bg-primary">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {vehicle.rating.toFixed(1)}
                  </Badge>
                </div>

                {/* Vehicle Info */}
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-bold">{vehicle.car_model}</div>
                      <div className="text-sm text-muted-foreground font-normal">
                        {vehicle.car_year} • {vehicle.car_color}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{vehicle.car_plate}</span>
                  </div>

                  {vehicle.car_category && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{vehicle.car_category.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {vehicle.car_category.passenger_capacity} seats
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{vehicle.total_trips} trips completed</span>
                  </div>

                  {vehicle.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {vehicle.bio}
                    </p>
                  )}

                  <Button className="w-full mt-2" variant="outline">
                    View Gallery
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedVehicle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold">{selectedVehicle.car_model}</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      {selectedVehicle.car_year} • {selectedVehicle.car_color} • {selectedVehicle.car_plate}
                    </div>
                  </div>
                  <Badge className="bg-primary">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {selectedVehicle.rating.toFixed(1)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Driver Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Driver Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Driver:</span>
                      <span className="font-medium">{selectedVehicle.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Trips:</span>
                      <span className="font-medium">{selectedVehicle.total_trips}</span>
                    </div>
                    {selectedVehicle.car_category && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium">{selectedVehicle.car_category.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span className="font-medium">{selectedVehicle.car_category.passenger_capacity} passengers</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Base Fare:</span>
                          <span className="font-medium">${selectedVehicle.car_category.base_fare}</span>
                        </div>
                      </>
                    )}
                    {selectedVehicle.bio && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">{selectedVehicle.bio}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Image Gallery */}
                {selectedVehicle.images.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Photos</h3>
                    <Carousel className="w-full">
                      <CarouselContent>
                        {selectedVehicle.images.map((image) => (
                          <CarouselItem key={image.id} className="md:basis-1/2">
                            <div className="relative aspect-video rounded-lg overflow-hidden">
                              <img
                                src={image.image_url}
                                alt="Car"
                                className="w-full h-full object-cover"
                              />
                              {image.is_primary && (
                                <Badge className="absolute top-2 left-2 bg-primary">
                                  <Star className="h-3 w-3 mr-1" />
                                  Primary
                                </Badge>
                              )}
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  </div>
                )}

                {/* Video Gallery */}
                {selectedVehicle.videos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Videos</h3>
                    <Carousel className="w-full">
                      <CarouselContent>
                        {selectedVehicle.videos.map((video) => (
                          <CarouselItem key={video.id}>
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                              <video
                                src={video.video_url}
                                controls
                                className="w-full h-full object-contain"
                                preload="metadata"
                              />
                              {video.is_primary && (
                                <Badge className="absolute top-2 left-2 bg-primary">
                                  <Star className="h-3 w-3 mr-1" />
                                  Primary
                                </Badge>
                              )}
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  </div>
                )}

                {/* Features */}
                {selectedVehicle.car_category?.features && selectedVehicle.car_category.features.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedVehicle.car_category.features.map((feature, index) => (
                          <Badge key={index} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleShowcase;