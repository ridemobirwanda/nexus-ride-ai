import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Car, Clock, Star, DollarSign } from 'lucide-react';
import Map from '@/components/Map';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { supabase } from '@/integrations/supabase/client';
import CarCategorySelector from '@/components/CarCategorySelector';
import { useFareCalculator } from '@/hooks/useFareCalculator';
import InlineRegistration from '@/components/InlineRegistration';
import { toast } from '@/hooks/use-toast';

interface AvailableDriver {
  id: string;
  name: string;
  car_model: string;
  car_plate: string;
  rating: number;
  current_location: [number, number];
  distance: number;
  estimated_arrival: number;
  car_category: {
    id: string;
    name: string;
    base_fare: number;
    base_price_per_km: number;
    minimum_fare: number;
    passenger_capacity: number;
    image_url?: string;
  };
}

const Index = () => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number; address: string} | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<{lat: number; lng: number; address: string} | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<AvailableDriver | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card'>('cash');
  const [user, setUser] = useState<any>(null);
  
  const { getCurrentLocation, isLoading: locationLoading } = useCurrentLocation({ autoFetch: false });
  const { estimatedFare, distance, formatCurrency } = useFareCalculator(
    currentLocation, 
    dropoffLocation, 
    selectedDriver?.car_category
  );

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-detect location on load
  useEffect(() => {
    handleGetCurrentLocation();
  }, []);

  // Fetch available drivers when location is set
  useEffect(() => {
    if (currentLocation) {
      fetchAvailableDrivers();
    }
  }, [currentLocation]);

  const handleGetCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation({
        lat: location.latitude,
        lng: location.longitude,
        address: location.address
      });
    } catch (error) {
      toast({
        title: "Location Error",
        description: "Please enable location access to find nearby drivers",
        variant: "destructive"
      });
    }
  };

  const fetchAvailableDrivers = async () => {
    if (!currentLocation) return;

    try {
      const { data, error } = await supabase.rpc('find_nearest_driver', {
        p_pickup_location: `(${currentLocation.lng},${currentLocation.lat})`,
        p_max_distance_km: 10,
        p_limit: 10
      });

      if (error) throw error;

      // Transform the data to include car category info
      const driversWithCategories = await Promise.all(
        data.map(async (driver: any) => {
          const { data: categoryData } = await supabase
            .from('car_categories')
            .select('*')
            .eq('id', driver.car_category_id)
            .single();

          return {
            ...driver,
            distance: driver.distance_km,
            estimated_arrival: driver.estimated_arrival_minutes,
            current_location: [currentLocation.lng, currentLocation.lat] as [number, number],
            car_category: categoryData || {
              id: 'default',
              name: 'Standard',
              base_fare: 2.50,
              base_price_per_km: 1.20,
              minimum_fare: 5.00,
              passenger_capacity: 4
            }
          };
        })
      );

      setAvailableDrivers(driversWithCategories);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleBookRide = async () => {
    if (!user) {
      setShowRegistration(true);
      return;
    }

    if (!currentLocation || !dropoffLocation || !selectedDriver) {
      toast({
        title: "Missing Information",
        description: "Please select pickup, dropoff locations and a driver",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get passenger profile
      const { data: passenger } = await supabase
        .from('passengers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!passenger) {
        toast({
          title: "Profile Error",
          description: "Please complete your profile first",
          variant: "destructive"
        });
        return;
      }

      // Create ride booking
      const { data: ride, error } = await supabase
        .from('rides')
        .insert({
          passenger_id: passenger.id,
          driver_id: selectedDriver.id,
          pickup_location: `(${currentLocation.lng},${currentLocation.lat})`,
          pickup_address: currentLocation.address,
          dropoff_location: `(${dropoffLocation.lng},${dropoffLocation.lat})`,
          dropoff_address: dropoffLocation.address,
          estimated_fare: estimatedFare,
          payment_method: paymentMethod,
          car_category_id: selectedDriver.car_category.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ride Booked!",
        description: `Your ride has been booked. Driver ${selectedDriver.name} will arrive in ${selectedDriver.estimated_arrival} minutes.`
      });

      // Navigate to ride tracking
      navigate('/passenger/dashboard');
    } catch (error: any) {
      toast({
        title: "Booking Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRegistrationComplete = (userData: any) => {
    setShowRegistration(false);
    // Auto-book after registration
    setTimeout(() => {
      handleBookRide();
    }, 1000);
  };

  return (
    <div className="min-h-screen rider-bg">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b px-4 py-3 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">RideNow</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <Button variant="outline" onClick={() => navigate('/passenger/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate('/passenger/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Current Location Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Your Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {currentLocation?.address || "Detecting location..."}
              </p>
              <Button variant="outline" size="sm" onClick={handleGetCurrentLocation} disabled={locationLoading}>
                {locationLoading ? "Detecting..." : "Update Location"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Map */}
        <Card>
          <CardContent className="p-0">
            <Map
              onLocationSelect={(location, type) => {
                if (type === 'dropoff') {
                  setDropoffLocation(location);
                }
              }}
              pickupLocation={currentLocation}
              dropoffLocation={dropoffLocation}
              showAllDrivers={true}
              className="h-80"
            />
          </CardContent>
        </Card>

        {/* Available Drivers */}
        {availableDrivers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Available Drivers ({availableDrivers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDriver?.id === driver.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedDriver(driver)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <Car className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{driver.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {driver.car_model} • {driver.car_plate}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{driver.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">{driver.estimated_arrival} min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatCurrency(driver.car_category.base_fare)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {driver.distance.toFixed(1)}km away
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Dropoff Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Dropoff Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {dropoffLocation?.address || "Tap on the map or type an address"}
            </p>
            <input
              type="text"
              placeholder="Enter destination address"
              className="w-full p-2 border rounded-md"
              value={dropoffLocation?.address || ''}
              onChange={(e) => {
                // For demo purposes, just update the address
                if (dropoffLocation) {
                  setDropoffLocation({...dropoffLocation, address: e.target.value});
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Booking Summary - Only show after dropoff is selected */}
        {selectedDriver && dropoffLocation && (
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Route Preview */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Route Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>{currentLocation?.address}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-1">
                    <div className="w-1 h-8 bg-gray-300"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>{dropoffLocation.address}</span>
                  </div>
                </div>
              </div>

              {/* Fare Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span>{distance.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Fare:</span>
                  <span>{formatCurrency(selectedDriver.car_category.base_fare)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance Cost:</span>
                  <span>{formatCurrency(distance * selectedDriver.car_category.base_price_per_km)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Estimated Fare:</span>
                  <span className="text-primary">{formatCurrency(estimatedFare)}</span>
                </div>
              </div>

              {/* Driver Info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Your Driver</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedDriver.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDriver.car_model} • {selectedDriver.car_plate}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Arrives in {selectedDriver.estimated_arrival} minutes
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <h4 className="font-medium">Choose Payment Method</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-4 h-4"
                    />
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Cash Payment</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      name="payment"
                      value="mobile_money"
                      checked={paymentMethod === 'mobile_money'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-4 h-4"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📱</span>
                      <span>Mobile Money (MoMo)</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-4 h-4"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💳</span>
                      <span>Credit/Debit Card</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Book Ride Button */}
              <Button 
                onClick={handleBookRide} 
                className="w-full" 
                size="lg"
                disabled={!currentLocation || !dropoffLocation || !selectedDriver}
              >
                Book Ride - {formatCurrency(estimatedFare)}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Registration Modal */}
      {showRegistration && (
        <InlineRegistration 
          onRegistrationComplete={handleRegistrationComplete}
          title="Complete Your Booking"
          description="Just enter your details to book this ride"
        />
      )}
    </div>
  );
};

export default Index;
