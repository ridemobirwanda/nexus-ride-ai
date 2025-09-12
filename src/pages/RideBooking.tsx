import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  MapPin, 
  Search,
  Navigation,
  CreditCard,
  DollarSign,
  Clock,
  Car,
  Loader2
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import InlineRegistration from '@/components/InlineRegistration';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface CarCategory {
  id: string;
  name: string;
  description: string;
  base_fare: number;
  base_price_per_km: number;
  minimum_fare: number;
  passenger_capacity: number;
}

interface Passenger {
  id: string;
  name: string;
}

const RideBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const pickupMarker = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarker = useRef<mapboxgl.Marker | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<CarCategory | null>(null);
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  
  const [locationData, setLocationData] = useState({
    pickupLocation: null as Location | null,
    dropoffLocation: null as Location | null,
    pickupAddress: '',
    dropoffAddress: '',
    paymentMethod: 'cash' as 'cash' | 'mobile_money' | 'card'
  });

  const [mapState, setMapState] = useState({
    searchQuery: '',
    isSearching: false,
    searchResults: [] as any[]
  });

  useEffect(() => {
    checkAuth();
    fetchCategoryFromUrl();
    initializeMap();
    getCurrentLocation();
  }, []);

  // Get Mapbox token from Supabase secrets
  const [mapboxToken, setMapboxToken] = useState<string>('');

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Get passenger details
      const { data: passengerData } = await supabase
        .from('passengers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setPassenger(passengerData);
    }
  };

  const fetchCategoryFromUrl = async () => {
    const categoryId = searchParams.get('category');
    if (categoryId) {
      const { data } = await supabase
        .from('car_categories')
        .select('*')
        .eq('id', categoryId)
        .single();
      
      if (data) {
        setSelectedCategory(data);
      }
    }
  };

  const initializeMap = async () => {
    if (!mapContainer.current) return;

    // Get Mapbox token from Supabase secrets
    const { data } = await supabase.functions.invoke('get-mapbox-token');
    const token = data?.token || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZkangifQ.-g_vE53SD2WrJ6tFX7QHmA';
    
    mapboxgl.accessToken = token;
    setMapboxToken(token);
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-day-v1',
      center: [30.0588, -1.9414], // Kigali, Rwanda
      zoom: 12,
      pitch: 45,
      bearing: -15,
      antialias: true
    });

    // Add 3D buildings
    map.current.on('load', () => {
      if (!map.current) return;
      
      map.current.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });
      
      map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
      
      // Add 3D buildings layer
      if (!map.current.getLayer('building-3d')) {
        map.current.addLayer({
          'id': 'building-3d',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 10,
          'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        });
      }
    });

    // Add click handler for location selection
    map.current.on('click', handleMapClick);
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 14
            });
          }
          
          // Set as pickup location
          const currentLocation: Location = {
            lat: latitude,
            lng: longitude,
            address: 'Current Location'
          };
          
          setLocationData(prev => ({
            ...prev,
            pickupLocation: currentLocation,
            pickupAddress: 'Current Location'
          }));
          
          addPickupMarker(longitude, latitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Access",
            description: "Unable to get your current location. Please select pickup manually.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const handleMapClick = async (e: any) => {
    const { lng, lat } = e.lngLat;
    
    try {
      // Reverse geocoding to get address
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&country=RW`
      );
      const data = await response.json();
      const address = data.features[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      const newLocation: Location = { lat, lng, address };
      
      // Only allow dropoff selection
      setLocationData(prev => ({
        ...prev,
        dropoffLocation: newLocation,
        dropoffAddress: address
      }));
      addDropoffMarker(lng, lat);
      toast({
        title: "Drop-off Set",
        description: address
      });
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const addPickupMarker = (lng: number, lat: number) => {
    if (!map.current) return;
    
    if (pickupMarker.current) {
      pickupMarker.current.remove();
    }
    
    const el = document.createElement('div');
    el.className = 'pickup-marker';
    el.style.cssText = `
      background-color: #10b981;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    
    pickupMarker.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(map.current);
  };

  const addDropoffMarker = (lng: number, lat: number) => {
    if (!map.current) return;
    
    if (dropoffMarker.current) {
      dropoffMarker.current.remove();
    }
    
    const el = document.createElement('div');
    el.className = 'dropoff-marker';
    el.style.cssText = `
      background-color: #ef4444;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    
    dropoffMarker.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(map.current);
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) return;
    
    setMapState(prev => ({ ...prev, isSearching: true }));
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&country=RW&proximity=30.0588,-1.9414&limit=5`
      );
      const data = await response.json();
      
      setMapState(prev => ({ 
        ...prev, 
        searchResults: data.features || [],
        isSearching: false 
      }));
    } catch (error) {
      console.error('Search error:', error);
      setMapState(prev => ({ ...prev, isSearching: false }));
    }
  };

  const selectSearchResult = (feature: any) => {
    const [lng, lat] = feature.center;
    const address = feature.place_name;
    
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 16
      });
    }
    
    const newLocation: Location = { lat, lng, address };
    
    // Only allow dropoff selection
    setLocationData(prev => ({
      ...prev,
      dropoffLocation: newLocation,
      dropoffAddress: address
    }));
    addDropoffMarker(lng, lat);
    
    setMapState(prev => ({ 
      ...prev, 
      searchQuery: '',
      searchResults: []
    }));
  };

  const calculateDistance = () => {
    if (!locationData.pickupLocation || !locationData.dropoffLocation) return 0;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (locationData.dropoffLocation.lat - locationData.pickupLocation.lat) * Math.PI / 180;
    const dLon = (locationData.dropoffLocation.lng - locationData.pickupLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(locationData.pickupLocation.lat * Math.PI / 180) * 
      Math.cos(locationData.dropoffLocation.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateFare = () => {
    if (!selectedCategory) return 0;
    const distance = calculateDistance();
    const fare = selectedCategory.base_fare + (distance * selectedCategory.base_price_per_km);
    return Math.max(fare, selectedCategory.minimum_fare);
  };

  const formatCurrency = (amount: number) => {
    return `${Math.round(amount).toLocaleString()} RWF`;
  };

  const handleBookRide = async () => {
    if (!passenger) {
      setShowRegistration(true);
      return;
    }

    if (!locationData.pickupLocation || !locationData.dropoffLocation || !selectedCategory) {
      toast({
        title: "Missing Information",
        description: "Please select both pickup and drop-off locations",
        variant: "destructive"
      });
      return;
    }

    setIsBooking(true);

    try {
      const { data, error } = await supabase
        .from('rides')
        .insert({
          passenger_id: passenger.id,
          pickup_address: locationData.pickupAddress,
          dropoff_address: locationData.dropoffAddress,
          pickup_location: `POINT(${locationData.pickupLocation.lng} ${locationData.pickupLocation.lat})`,
          dropoff_location: `POINT(${locationData.dropoffLocation.lng} ${locationData.dropoffLocation.lat})`,
          estimated_fare: calculateFare(),
          payment_method: locationData.paymentMethod,
          car_category_id: selectedCategory.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ride Booked Successfully!",
        description: `Finding drivers nearby. Fare: ${formatCurrency(calculateFare())}`
      });

      navigate(`/passenger/ride/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No Car Category Selected</h2>
          <Button onClick={() => navigate('/passenger')} variant="outline">
            ← Back to Ride Selection
          </Button>
        </div>
      </div>
    );
  }

  if (showRegistration && !passenger) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <InlineRegistration
              onRegistrationComplete={(user) => {
                setShowRegistration(false);
                // Refresh passenger data
                checkAuth();
              }}
              title="Quick Registration"
              description="Just enter your details to book your ride"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/passenger')}
              className="flex items-center gap-2 h-10"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex flex-col items-center">
              <h1 className="text-lg font-semibold text-foreground">Book Your Ride</h1>
              <Badge variant="secondary" className="text-xs">
                {selectedCategory.name}
              </Badge>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Mobile-First Layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Map Section */}
        <div className="relative flex-1 order-2 lg:order-1">
          <div 
            ref={mapContainer} 
            className="w-full h-[50vh] sm:h-[60vh] lg:h-screen"
          />
          
          {/* Map Status Indicator */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <Card className="bg-card/95 backdrop-blur-sm border-border shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-foreground">Pickup: Current Location</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {locationData.dropoffLocation ? 'Drop-off set' : 'Select drop-off'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <Card className="bg-card/95 backdrop-blur-sm border-border shadow-lg">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for drop-off location..."
                      value={mapState.searchQuery}
                      onChange={(e) => {
                        setMapState(prev => ({ ...prev, searchQuery: e.target.value }));
                        if (e.target.value.length > 2) {
                          searchLocation(e.target.value);
                        }
                      }}
                      className="pl-10 bg-input border-border"
                    />
                    {mapState.isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Search Results */}
                  {mapState.searchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {mapState.searchResults.map((result, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className="w-full justify-start text-left p-2 h-auto"
                          onClick={() => selectSearchResult(result)}
                        >
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
                          <span className="text-sm truncate">{result.place_name}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground text-center">
                    Tap on the map or search to set your drop-off location
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Booking Panel */}
        <div className="w-full lg:w-80 xl:w-96 order-1 lg:order-2 bg-card border-b lg:border-b-0 lg:border-l border-border">
          <div className="p-4 space-y-4 max-h-screen overflow-y-auto">
            {/* Trip Summary */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  {selectedCategory.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">{selectedCategory.passenger_capacity} passengers</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Base Fare</span>
                  <span className="font-medium">{formatCurrency(selectedCategory.base_fare)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Estimated Fare</span>
                  <span className="font-bold text-primary text-lg">
                    {locationData.pickupLocation && locationData.dropoffLocation 
                      ? formatCurrency(calculateFare())
                      : '---'
                    }
                  </span>
                </div>
                {locationData.pickupLocation && locationData.dropoffLocation && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Distance: {calculateDistance().toFixed(2)} km</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/20">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="text-sm font-medium truncate">
                        {locationData.pickupAddress || 'Current Location'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-2 rounded-md bg-red-50 dark:bg-red-950/20">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Drop-off</p>
                      <p className="text-sm font-medium truncate">
                        {locationData.dropoffAddress || 'Select destination'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentMethodSelector
                  paymentMethod={locationData.paymentMethod}
                  onPaymentMethodChange={(method) => setLocationData(prev => ({ ...prev, paymentMethod: method }))}
                />
              </CardContent>
            </Card>

            {/* Book Button */}
            <Button
              onClick={handleBookRide}
              disabled={!locationData.pickupLocation || !locationData.dropoffLocation || isBooking}
              className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isBooking ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Car className="h-5 w-5 mr-2" />
                  Book Ride
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              By booking, you agree to our terms and conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideBooking;