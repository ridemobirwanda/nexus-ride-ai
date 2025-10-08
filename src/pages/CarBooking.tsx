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
import InlineRegistration from '@/components/InlineRegistration';

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
  const [showRegistration, setShowRegistration] = useState(false);

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

  const checkAuth = async () => {
    // Allow browsing without authentication
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user || null);
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
      
      // Auto-set pickup and return locations to car's location
      setBookingData(prev => ({
        ...prev,
        pickupLocation: data.location_address || '',
        returnLocation: data.location_address || ''
      }));
    } catch (error) {
      console.error('Error fetching car:', error);
      toast({
        title: "Error",
        description: "Failed to load car details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDuration = (startDate: string, endDate: string, durationType: 'hourly' | 'daily') => {
    if (!startDate || !endDate) {
      return 0;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    const diffMs = end.getTime() - start.getTime();

    if (diffMs <= 0) {
      return 0;
    }

    let duration;
    if (durationType === 'hourly') {
      // For hourly: minimum 1 hour, round up to nearest hour
      duration = Math.ceil(diffMs / (1000 * 60 * 60));
    } else {
      // For daily: minimum 1 day, calculate exact days
      duration = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    return Math.max(1, duration);
  };

  // Update duration whenever dates or type changes
  useEffect(() => {
    const newDuration = calculateDuration(
      bookingData.rentalStart, 
      bookingData.rentalEnd, 
      bookingData.durationType
    );
    
    setBookingData(prev => ({ ...prev, durationValue: newDuration }));
  }, [bookingData.rentalStart, bookingData.rentalEnd, bookingData.durationType]);

  const validateDates = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return { isValid: false, message: "Please select both start and end dates" };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isValid: false, message: "Invalid date format" };
    }
    
    if (start < now) {
      return { isValid: false, message: "Start date cannot be in the past" };
    }
    
    if (end <= start) {
      return { isValid: false, message: "End date must be after start date" };
    }
    
    return { isValid: true, message: "" };
  };

  const handleDateChange = (field: 'rentalStart' | 'rentalEnd', value: string) => {
    const newBookingData = { ...bookingData, [field]: value };
    setBookingData(newBookingData);
  };

  const formatDuration = (duration: number, type: 'hourly' | 'daily') => {
    if (duration === 0) return "Invalid duration";
    const unit = type === 'hourly' ? (duration === 1 ? 'hour' : 'hours') : (duration === 1 ? 'day' : 'days');
    return `${duration} ${unit}`;
  };

  const calculateTotalPrice = () => {
    if (!car) return 0;
    const rate = bookingData.durationType === 'hourly' ? car.price_per_hour : car.price_per_day;
    return rate * bookingData.durationValue;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF'
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If no user, show registration
    if (!user) {
      setShowRegistration(true);
      return;
    }

    if (!car) return;

    // Enhanced validation
    const dateValidation = validateDates(bookingData.rentalStart, bookingData.rentalEnd);
    if (!dateValidation.isValid) {
      toast({
        title: "Invalid Dates",
        description: dateValidation.message,
        variant: "destructive"
      });
      return;
    }

    if (!bookingData.driverLicenseNumber?.trim() || !bookingData.contactPhone?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in your driver's license number and contact phone",
        variant: "destructive"
      });
      return;
    }

    if (bookingData.durationValue <= 0) {
      toast({
        title: "Invalid Duration",
        description: "Please select a valid rental period",
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
          special_requests: bookingData.specialRequests,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Booking Confirmed!",
        description: "Your car rental has been booked successfully. Check your rentals for details.",
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

  // Show registration overlay if needed
  if (showRegistration && !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <InlineRegistration
              onRegistrationComplete={(registeredUser) => {
                setShowRegistration(false);
                setUser(registeredUser);
              }}
              title="Complete Registration"
              description="Just a few details to confirm your car rental"
            />
          </div>
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
              <Card className="gradient-card card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Rental Period
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date & Time</Label>
                      <Input
                        id="start-date"
                        type="datetime-local"
                        min={getMinDate()}
                        value={bookingData.rentalStart}
                        onChange={(e) => handleDateChange('rentalStart', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date & Time</Label>
                      <Input
                        id="end-date"
                        type="datetime-local"
                        min={bookingData.rentalStart || getMinDate()}
                        value={bookingData.rentalEnd}
                        onChange={(e) => handleDateChange('rentalEnd', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Billing Type</Label>
                    <RadioGroup
                      value={bookingData.durationType}
                      onValueChange={(value: 'hourly' | 'daily') => 
                        setBookingData({ ...bookingData, durationType: value })
                      }
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hourly" id="hourly" />
                        <Label htmlFor="hourly" className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Hourly ({formatPrice(car.price_per_hour)}/hr)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daily" id="daily" />
                        <Label htmlFor="daily" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Daily ({formatPrice(car.price_per_day)}/day)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Duration Display */}
                  {bookingData.rentalStart && bookingData.rentalEnd && (
                    <div className={`p-4 rounded-lg border-2 ${
                      bookingData.durationValue > 0 
                        ? 'bg-primary/10 border-primary/30 shadow-sm' 
                        : 'bg-destructive/10 border-destructive/30'
                    }`}>
                      {bookingData.durationValue > 0 ? (
                        <div className="text-center space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <p className="font-semibold text-primary text-lg">
                              Duration: {formatDuration(bookingData.durationValue, bookingData.durationType)}
                            </p>
                          </div>
                          <div className="text-sm bg-white/50 rounded-md p-2">
                            <p className="text-muted-foreground">
                              Rate: {formatPrice(bookingData.durationType === 'hourly' ? car.price_per_hour : car.price_per_day)}
                              /{bookingData.durationType === 'hourly' ? 'hour' : 'day'}
                            </p>
                            <p className="font-medium text-primary mt-1">
                              Total: {formatPrice(calculateTotalPrice())}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <p className="font-medium text-destructive">Invalid Date Range</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {validateDates(bookingData.rentalStart, bookingData.rentalEnd).message}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show helper text when no dates selected */}
                  {(!bookingData.rentalStart || !bookingData.rentalEnd) && (
                    <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30">
                      <div className="text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-medium">
                          Select rental dates to calculate duration and pricing
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pickup & Return */}
              <Card className="gradient-card card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Pickup & Return Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <Label className="text-sm font-semibold mb-1 block">Pickup Location</Label>
                        <p className="text-sm">{bookingData.pickupLocation}</p>
                        <Badge variant="secondary" className="mt-2">
                          Set by car owner
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                      <MapPin className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <Label className="text-sm font-semibold mb-1 block">Return Location</Label>
                        <p className="text-sm">{bookingData.returnLocation}</p>
                        <Badge variant="secondary" className="mt-2">
                          Same as pickup
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>The pickup and return locations are set by the car owner based on where the vehicle is located. Please ensure you can access this location during your rental period.</span>
                  </p>
                </CardContent>
              </Card>

              {/* Driver Information */}
              <Card className="gradient-card card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Driver Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="license">Driver's License Number *</Label>
                      <Input
                        id="license"
                        placeholder="Enter license number"
                        value={bookingData.driverLicenseNumber}
                        onChange={(e) => setBookingData({ ...bookingData, driverLicenseNumber: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Contact Phone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter phone number"
                          className="pl-10"
                          value={bookingData.contactPhone}
                          onChange={(e) => setBookingData({ ...bookingData, contactPhone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
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

                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatPrice(calculateTotalPrice())}
                      </span>
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
                    ) : !user ? (
                      'Register & Confirm Booking'
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