import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Car, 
  Users, 
  Fuel, 
  Calendar, 
  MapPin, 
  Star,
  Clock,
  DollarSign,
  Shield,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';

interface CarImage {
  id: string;
  image_url: string;
  caption: string;
  display_order: number;
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
  images: CarImage[];
}

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [car, setCar] = useState<RentalCar | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCarDetails();
    }
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_cars')
        .select(`
          *,
          rental_car_images(
            id,
            image_url,
            caption,
            display_order
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      const carWithImages = {
        ...data,
        features: Array.isArray(data.features) ? data.features.map(f => String(f)) : [],
        images: data.rental_car_images?.sort((a: any, b: any) => a.display_order - b.display_order) || []
      };

      setCar(carWithImages);
    } catch (error: any) {
      toast({
        title: t('errors.loadFailed'),
        description: t('carDetail.errors.loadFailed'),
        variant: "destructive"
      });
      navigate('/cars');
    } finally {
      setIsLoading(false);
    }
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

  const nextImage = () => {
    if (car?.images.length) {
      setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
    }
  };

  const prevImage = () => {
    if (car?.images.length) {
      setCurrentImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length);
    }
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes('gps') || feature.toLowerCase().includes('navigation')) return '🗺️';
    if (feature.toLowerCase().includes('air') || feature.toLowerCase().includes('conditioning')) return '❄️';
    if (feature.toLowerCase().includes('leather') || feature.toLowerCase().includes('seat')) return '💺';
    if (feature.toLowerCase().includes('bluetooth') || feature.toLowerCase().includes('audio')) return '🔊';
    if (feature.toLowerCase().includes('safety') || feature.toLowerCase().includes('airbag')) return '🛡️';
    if (feature.toLowerCase().includes('sunroof') || feature.toLowerCase().includes('roof')) return '🌅';
    return '✅';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <h2 className="text-2xl font-semibold mb-2">{t('carDetail.loading')}</h2>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">{t('carBooking.carNotFound')}</h2>
          <Button onClick={() => navigate('/cars')} variant="outline">
            ← {t('carDetail.backToCars')}
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
            onClick={() => navigate('/cars')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('carDetail.backToCars')}
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {getTypeIcon(car.car_type)} {car.car_type}
            </Badge>
            <Badge 
              className={car.availability_status === 'available' 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-red-100 text-red-800 border-red-200'
              }
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {car.availability_status === 'available' ? t('rentals.available') : t('rentals.unavailable')}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <Card className="gradient-card card-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  {car.images.length > 0 ? (
                    <>
                      <div className="relative h-80 md:h-96 overflow-hidden rounded-t-lg">
                        <img
                          src={car.images[currentImageIndex]?.image_url || '/placeholder.svg'}
                          alt={car.images[currentImageIndex]?.caption || `${car.brand} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Navigation Arrows */}
                        {car.images.length > 1 && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                              onClick={prevImage}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                              onClick={nextImage}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {/* Image Counter */}
                        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {car.images.length}
                        </div>
                      </div>

                      {/* Thumbnail Gallery */}
                      {car.images.length > 1 && (
                        <div className="p-4">
                          <div className="flex gap-2 overflow-x-auto">
                            {car.images.map((image, index) => (
                              <div
                                key={image.id}
                                className={`relative w-20 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                                  index === currentImageIndex 
                                    ? 'border-primary shadow-lg' 
                                    : 'border-muted hover:border-primary/50'
                                }`}
                                onClick={() => setCurrentImageIndex(index)}
                              >
                                <img
                                  src={image.image_url}
                                  alt={image.caption}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-80 md:h-96 flex items-center justify-center bg-muted rounded-t-lg">
                      <ImageIcon className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>About This Car</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {car.description}
                </p>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Features & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {car.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-lg">{getFeatureIcon(feature)}</span>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card className="gradient-card card-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {car.brand} {car.model}
                  </CardTitle>
                  <p className="text-muted-foreground">{car.year}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('carDetail.seats')}</span>
                      </div>
                      <span className="font-medium">{car.seating_capacity} {t('booking.category')}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('carDetail.fuel')}</span>
                      </div>
                      <span className="font-medium">{car.fuel_type}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t('carDetail.location')}</span>
                      </div>
                      <span className="font-medium text-right text-sm">{car.location_address}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Pricing */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(car.price_per_day)}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{t('carDetail.pricePerDay')}</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-semibold">
                          {formatPrice(car.price_per_hour)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{t('carDetail.pricePerHour')}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Book Now Button */}
                  <Button 
                    className="w-full gradient-primary text-lg py-6"
                    onClick={() => navigate(`/cars/${car.id}/book`)}
                    disabled={car.availability_status !== 'available'}
                  >
                    {car.availability_status === 'available' ? (
                      <>
                        <Calendar className="h-5 w-5 mr-2" />
                        {t('carDetail.bookNow')}
                      </>
                    ) : (
                      t('rentals.unavailable')
                    )}
                  </Button>

                  {/* Safety Badge */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        Verified & Insured
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="text-center text-sm text-muted-foreground">
                    Need help? Contact our support team<br/>
                    <span className="font-medium">+250 123 456 789</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetail;