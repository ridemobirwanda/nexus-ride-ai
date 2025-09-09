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
  const [isDraggingDropoff, setIsDraggingDropoff] = useState(false);
  
  // Sample available drivers data
  const sampleDrivers: AvailableDriver[] = [
    {
      id: '1',
      name: 'John Uwimana',
      car_model: 'Toyota Camry',
      car_plate: 'RAB 123A',
      rating: 4.8,
      current_location: [30.0619, -1.9441],
      distance: 0.8,
      estimated_arrival: 5,
      car_category: {
        id: 'standard',
        name: 'Standard',
        base_fare: 2500,
        base_price_per_km: 400,
        minimum_fare: 2000,
        passenger_capacity: 4,
        image_url: '/api/placeholder/300/200'
      }
    },
    {
      id: '2', 
      name: 'Marie Mukamana',
      car_model: 'Honda Civic',
      car_plate: 'RAB 456B',
      rating: 4.9,
      current_location: [30.0819, -1.9341],
      distance: 1.2,
      estimated_arrival: 7,
      car_category: {
        id: 'comfort',
        name: 'Comfort',
        base_fare: 3000,
        base_price_per_km: 500,
        minimum_fare: 2500,
        passenger_capacity: 4,
        image_url: '/api/placeholder/300/200'
      }
    },
    {
      id: '3',
      name: 'David Nkurunziza', 
      car_model: 'BMW X5',
      car_plate: 'RAB 789C',
      rating: 4.7,
      current_location: [30.0419, -1.9541],
      distance: 1.5,
      estimated_arrival: 8,
      car_category: {
        id: 'premium',
        name: 'Premium',
        base_fare: 5000,
        base_price_per_km: 800,
        minimum_fare: 4000,
        passenger_capacity: 4,
        image_url: '/api/placeholder/300/200'
      }
    }
  ];
  
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

  // Show available drivers immediately when dropoff is selected
  useEffect(() => {
    if (currentLocation && dropoffLocation) {
      setAvailableDrivers(sampleDrivers);
    }
  }, [currentLocation, dropoffLocation]);

  const handleMapClick = (location: {lat: number; lng: number; address: string}) => {
    setDropoffLocation(location);
  };

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

        {/* Live Map with Draggable Dropoff */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {!dropoffLocation ? "Drag the red pin to select dropoff location" : "Selected Locations"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 relative">
            <Map
              onLocationSelect={handleMapClick}
              pickupLocation={currentLocation}
              dropoffLocation={dropoffLocation}
              showAllDrivers={true}
              className="h-80"
            />
            
            {/* Draggable Dropoff Icon */}
            {!dropoffLocation && (
              <div 
                className="absolute top-4 left-4 z-50 bg-red-500 text-white p-3 rounded-full shadow-lg cursor-move hover:bg-red-600 transition-colors"
                draggable
                onDragStart={() => setIsDraggingDropoff(true)}
                onDragEnd={() => setIsDraggingDropoff(false)}
              >
                <MapPin className="h-6 w-6" />
              </div>
            )}
            
            {dropoffLocation && (
              <div className="absolute bottom-4 left-4 right-4 bg-green-500 text-white p-2 rounded-lg text-center text-sm font-medium">
                ✅ Dropoff location selected! Available cars are shown below.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Drivers - Show immediately after dropoff selection */}
        {currentLocation && dropoffLocation && availableDrivers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-green-500" />
                🚗 Available Cars Near You ({availableDrivers.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">Select your preferred car</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedDriver?.id === driver.id 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : 'border-border hover:border-green-300'
                  }`}
                  onClick={() => setSelectedDriver(driver)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {driver.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <Car className="h-3 w-3 text-white" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg text-gray-800">{driver.name}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            {driver.car_category.name}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 font-medium mb-2">
                          🚗 {driver.car_model} • 🚙 {driver.car_plate}
                        </p>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-gray-700">{driver.rating}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-green-600">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{driver.estimated_arrival} min away</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-blue-600">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">{driver.distance.toFixed(1)} km</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-2xl text-green-600">
                        {formatCurrency(driver.car_category.base_fare)}
                      </p>
                      <p className="text-sm text-gray-500">Base fare</p>
                      <p className="text-xs text-gray-400">
                        +{formatCurrency(driver.car_category.base_price_per_km)}/km
                      </p>
                    </div>
                  </div>

                  {selectedDriver?.id === driver.id && (
                    <div className="mt-3 pt-3 border-t border-green-200 bg-green-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
                      <p className="text-green-700 font-medium text-center">
                        ✅ Selected! Continue below to complete your booking
                      </p>
                    </div>
                  )}
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
