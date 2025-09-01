import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Car, 
  Calendar, 
  Clock,
  DollarSign,
  User,
  Phone,
  MapPin,
  CreditCard,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface RentalCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  car_type: string;
  price_per_day: number;
  price_per_hour: number;
  location_address: string;
}

const CarBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState<RentalCar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [bookingData, setBookingData] = useState({
    rentalStart: '',
    rentalEnd: '',
    durationType: 'daily' as 'hourly' | 'daily',
    durationValue: 1,
    pickupLocation: '',
    returnLocation: '',
    driverLicenseNumber: '',
    contactPhone: '',
    specialRequests: ''
  });

  useEffect(() => {
    checkAuth();
    if (id) {
      fetchCarDetails();
    }
  }, [id]);

  useEffect(() => {
    calculateDuration();
  }, [bookingData.rentalStart, bookingData.rentalEnd, bookingData.durationType]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book a car",
        variant: "destructive"
      });
      navigate('/passenger/auth');
      return;
    }
    setUser(user);
  };

  const fetchCarDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_cars')
        .select('id, brand, model, year, car_type, price_per_day, price_per_hour, location_address')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setCar(data);
      
      // Set default locations
      setBookingData(prev => ({
        ...prev,
        pickupLocation: data.location_address,
        returnLocation: data.location_address
      }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load car details",
        variant: "destructive"
      });
      navigate('/cars');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDuration = () => {
    if (!bookingData.rentalStart || !bookingData.rentalEnd) return;

    const start = new Date(bookingData.rentalStart);
    const end = new Date(bookingData.rentalEnd);
    const diffMs = end.getTime() - start.getTime();

    if (diffMs <= 0) return;

    if (bookingData.durationType === 'hourly') {
      const hours = Math.ceil(diffMs / (1000 * 60 * 60));
      setBookingData(prev => ({ ...prev, durationValue: hours }));
    } else {
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      setBookingData(prev => ({ ...prev, durationValue: days }));
    }
  };

  const calculateTotalPrice = () => {
    if (!car) return 0;
    
    const basePrice = bookingData.durationType === 'hourly' 
      ? car.price_per_hour 
      : car.price_per_day;
    
    return basePrice * bookingData.durationValue;
  };

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString()} RWF`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !car) return;

    // Validation
    if (!bookingData.rentalStart || !bookingData.rentalEnd) {
      toast({
        title: "Invalid Dates",
        description: "Please select valid rental dates",
        variant: "destructive"
      });
      return;
    }

    if (!bookingData.driverLicenseNumber || !bookingData.contactPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const start = new Date(bookingData.rentalStart);
    const end = new Date(bookingData.rentalEnd);
    
    if (end <= start) {
      toast({
        title: "Invalid Dates",
        description: "End date must be after start date",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('car_rentals')
        .insert({
          car_id: car.id,
          user_id: user.id,
          rental_start: bookingData.rentalStart,
          rental_end: bookingData.rentalEnd,
          duration_type: bookingData.durationType,
          duration_value: bookingData.durationValue,
          total_price: calculateTotalPrice(),
          pickup_location: bookingData.pickupLocation,
          return_location: bookingData.returnLocation,
          driver_license_number: bookingData.driverLicenseNumber,
          contact_phone: bookingData.contactPhone,
          special_requests: bookingData.specialRequests
        });

      if (error) throw error;

      toast({
        title: "Booking Confirmed!",
        description: "Your car rental has been successfully booked. Check your email for confirmation details."
      });

      navigate('/passenger/rentals');
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().slice(0, 16);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <h2 className="text-2xl font-semibold mb-2">Loading Booking Details...</h2>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Car Not Found</h2>
          <Button onClick={() => navigate('/cars')} variant="outline">
            ← Back to Cars
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
            onClick={() => navigate(`/cars/${car.id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Car Details
          </Button>
          <h1 className="text-3xl font-bold">Book Your Rental</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rental Period */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Rental Period
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Duration Type */}
                  <div>
                    <Label>Rental Type</Label>
                    <RadioGroup 
                      value={bookingData.durationType} 
                      onValueChange={(value: 'hourly' | 'daily') => 
                        setBookingData({ ...bookingData, durationType: value })
                      }
                      className="flex gap-6 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hourly" id="hourly" />
                        <Label htmlFor="hourly">Hourly Rental</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daily" id="daily" />
                        <Label htmlFor="daily">Daily Rental</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date & Time</Label>
                      <Input
                        id="start-date"
                        type="datetime-local"
                        min={getMinDate()}
                        value={bookingData.rentalStart}
                        onChange={(e) => setBookingData({ ...bookingData, rentalStart: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">End Date & Time</Label>
                      <Input
                        id="end-date"
                        type="datetime-local"
                        min={bookingData.rentalStart || getMinDate()}
                        value={bookingData.rentalEnd}
                        onChange={(e) => setBookingData({ ...bookingData, rentalEnd: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {bookingData.durationValue > 0 && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          Duration: {bookingData.durationValue} {bookingData.durationType === 'hourly' ? 'hours' : 'days'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Pickup & Return
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="pickup-location">Pickup Location</Label>
                    <Input
                      id="pickup-location"
                      placeholder="Enter pickup address"
                      value={bookingData.pickupLocation}
                      onChange={(e) => setBookingData({ ...bookingData, pickupLocation: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="return-location">Return Location</Label>
                    <Input
                      id="return-location"
                      placeholder="Enter return address"
                      value={bookingData.returnLocation}
                      onChange={(e) => setBookingData({ ...bookingData, returnLocation: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Driver Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Driver Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="license">Driver's License Number *</Label>
                    <Input
                      id="license"
                      placeholder="Enter your driver's license number"
                      value={bookingData.driverLicenseNumber}
                      onChange={(e) => setBookingData({ ...bookingData, driverLicenseNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Contact Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={bookingData.contactPhone}
                      onChange={(e) => setBookingData({ ...bookingData, contactPhone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="requests">Special Requests (Optional)</Label>
                    <Textarea
                      id="requests"
                      placeholder="Any special requirements or requests..."
                      value={bookingData.specialRequests}
                      onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card className="gradient-card card-shadow">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Car Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-muted-foreground">{car.year} • {car.car_type}</p>
                    <Badge variant="outline">{car.location_address}</Badge>
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>
                        {bookingData.durationType === 'hourly' ? 'Hourly Rate' : 'Daily Rate'}
                      </span>
                      <span>
                        {formatPrice(bookingData.durationType === 'hourly' ? car.price_per_hour : car.price_per_day)}
                      </span>
                    </div>

                    {bookingData.durationValue > 0 && (
                      <div className="flex justify-between">
                        <span>
                          Duration ({bookingData.durationValue} {bookingData.durationType === 'hourly' ? 'hrs' : 'days'})
                        </span>
                        <span>×{bookingData.durationValue}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(calculateTotalPrice())}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Important Notes */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span>Valid driver's license required</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Insurance included</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>24/7 roadside assistance</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || calculateTotalPrice() === 0}
                    className="w-full gradient-primary text-lg py-6"
                  >
                    {isSubmitting ? (
                      'Processing Booking...'
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarBooking;