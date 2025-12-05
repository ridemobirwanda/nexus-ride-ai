import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [car, setCar] = useState<RentalCar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);

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
    if (!car || !bookingData.durationValue || bookingData.durationValue <= 0) return 0;
    const rate = bookingData.durationType === 'hourly' ? car.price_per_hour : car.price_per_day;
    const total = rate * bookingData.durationValue;
    return Math.round(total); // Ensure whole number for RWF
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return 'RWF 0';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(price));
  };

  const processBooking = async () => {
    if (!car || !user) return;

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
        title: t('success.booked'),
        description: t('carBooking.success.bookingReceived'),
      });

      navigate('/passenger/rentals');
    } catch (error: any) {
      toast({
        title: t('carBooking.errors.bookingFailed'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setShouldAutoSubmit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If no user, show registration and set flag to auto-submit after
    if (!user) {
      setShouldAutoSubmit(true);
      setShowRegistration(true);
      return;
    }

    await processBooking();
  };

  // Auto-submit booking after registration completes
  useEffect(() => {
    if (user && shouldAutoSubmit && !showRegistration) {
      processBooking();
    }
  }, [user, shouldAutoSubmit, showRegistration]);

  const getMinDate = () => {
    return new Date().toISOString().slice(0, 16);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <h2 className="text-2xl font-semibold mb-2">{t('common.loading')}</h2>
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
            ← {t('carBooking.backToCars')}
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
              title={t('carBooking.completeRegistration')}
              description={t('carBooking.registrationDesc')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/cars/${car.id}`)}
            className="flex items-center gap-2 self-start min-h-[44px] touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Car Details</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-xl sm:text-3xl font-bold">Book Your Rental</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Rental Period */}
              <Card className="gradient-card card-shadow">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    Rental Period
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="text-sm">Start Date & Time</Label>
                      <Input
                        id="start-date"
                        type="datetime-local"
                        min={getMinDate()}
                        value={bookingData.rentalStart}
                        onChange={(e) => handleDateChange('rentalStart', e.target.value)}
                        required
                        className="h-11 sm:h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-sm">End Date & Time</Label>
                      <Input
                        id="end-date"
                        type="datetime-local"
                        min={bookingData.rentalStart || getMinDate()}
                        value={bookingData.rentalEnd}
                        onChange={(e) => handleDateChange('rentalEnd', e.target.value)}
                        required
                        className="h-11 sm:h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Billing Type</Label>
                    <RadioGroup
                      value={bookingData.durationType}
                      onValueChange={(value: 'hourly' | 'daily') => 
                        setBookingData({ ...bookingData, durationType: value })
                      }
                      className="flex flex-col sm:flex-row gap-3 sm:gap-6"
                    >
                      <div className="flex items-center space-x-2 p-3 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none touch-manipulation">
                        <RadioGroupItem value="hourly" id="hourly" />
                        <Label htmlFor="hourly" className="flex items-center gap-2 text-sm cursor-pointer">
                          <Clock className="h-4 w-4" />
                          Hourly ({formatPrice(car.price_per_hour)}/hr)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none touch-manipulation">
                        <RadioGroupItem value="daily" id="daily" />
                        <Label htmlFor="daily" className="flex items-center gap-2 text-sm cursor-pointer">
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
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                    Pickup & Return Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs sm:text-sm font-semibold mb-1 block">Pickup Location</Label>
                        <p className="text-xs sm:text-sm break-words">{bookingData.pickupLocation}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Set by car owner
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-secondary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs sm:text-sm font-semibold mb-1 block">Return Location</Label>
                        <p className="text-xs sm:text-sm break-words">{bookingData.returnLocation}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Same as pickup
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>The pickup and return locations are set by the car owner based on where the vehicle is located.</span>
                  </p>
                </CardContent>
              </Card>

              {/* Driver Information */}
              <Card className="gradient-card card-shadow">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    Driver Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="license" className="text-sm">Driver's License Number *</Label>
                      <Input
                        id="license"
                        placeholder="Enter license number"
                        value={bookingData.driverLicenseNumber}
                        onChange={(e) => setBookingData({ ...bookingData, driverLicenseNumber: e.target.value })}
                        required
                        className="h-11 sm:h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">Contact Phone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter phone number"
                          className="pl-10 h-11 sm:h-10"
                          value={bookingData.contactPhone}
                          onChange={(e) => setBookingData({ ...bookingData, contactPhone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="requests" className="text-sm">Special Requests (Optional)</Label>
                    <Textarea
                      id="requests"
                      placeholder="Any special requirements or requests..."
                      value={bookingData.specialRequests}
                      onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                      rows={3}
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <Card className="gradient-card card-shadow">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  {/* Car Info */}
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="font-semibold text-base sm:text-lg">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{car.year} • {car.car_type}</p>
                    <Badge variant="outline" className="text-xs break-all">{car.location_address}</Badge>
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2 sm:space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {bookingData.durationType === 'hourly' ? 'Hourly Rate' : 'Daily Rate'}
                      </span>
                      <span className="font-medium">
                        {formatPrice(bookingData.durationType === 'hourly' ? car.price_per_hour : car.price_per_day)}
                      </span>
                    </div>

                    {bookingData.durationValue > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Duration ({bookingData.durationValue} {bookingData.durationType === 'hourly' ? 'hrs' : 'days'})
                        </span>
                        <span className="font-medium">×{bookingData.durationValue}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between font-bold text-base sm:text-lg">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatPrice(calculateTotalPrice())}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Important Notes */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>Valid driver's license required</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Insurance included</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>24/7 roadside assistance</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting || 
                      !bookingData.rentalStart || 
                      !bookingData.rentalEnd || 
                      bookingData.durationValue <= 0 ||
                      !bookingData.driverLicenseNumber?.trim() ||
                      !bookingData.contactPhone?.trim()
                    }
                    className="w-full gradient-primary text-sm sm:text-lg py-4 sm:py-6 min-h-[48px] touch-manipulation"
                  >
                    {isSubmitting ? (
                      'Processing...'
                    ) : !user ? (
                      'Register & Book'
                    ) : calculateTotalPrice() === 0 ? (
                      'Select Dates'
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        <span className="hidden sm:inline">Confirm Booking • </span>
                        {formatPrice(calculateTotalPrice())}
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