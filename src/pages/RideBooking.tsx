import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Loader2,
  User,
  Sparkles
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './RideBooking.css';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import InlineRegistration from '@/components/InlineRegistration';
import SmartLocationIndicator from '@/components/SmartLocationIndicator';
import { useSmartLocationCorrection } from '@/hooks/useSmartLocationCorrection';

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
  phone?: string;
  user_id: string;
}

const RideBooking = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const pickupMarker = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarker = useRef<mapboxgl.Marker | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<CarCategory | null>(null);
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [preferredDriverId, setPreferredDriverId] = useState<string | null>(null);
  const [preferredDriverName, setPreferredDriverName] = useState<string | null>(null);
  
  // Smart location correction
  const { correctLocation, isCorrecing, lastCorrection } = useSmartLocationCorrection();
  const [pickupCorrectionData, setPickupCorrectionData] = useState<{ confidence?: number; corrections?: string[] } | null>(null);
  const [dropoffCorrectionData, setDropoffCorrectionData] = useState<{ confidence?: number; corrections?: string[] } | null>(null);
  
  const [locationData, setLocationData] = useState({
    pickupLocation: null as Location | null,
    dropoffLocation: null as Location | null,
    pickupAddress: '',
    dropoffAddress: '',
    paymentMethod: 'cash' as 'cash' | 'mobile_money' | 'card',
    tempName: '',
    tempPhone: ''
  });

  const [mapState, setMapState] = useState({
    searchQuery: '',
    isSearching: false,
    searchResults: [] as any[],
    activeSelection: 'pickup' as 'pickup' | 'dropoff' | null
  });

  useEffect(() => {
    console.log('🚀 RideBooking component mounted');
    checkAuth();
    fetchCategoryFromUrl();
    getLocationFromUrl();
    getPreferredDriverFromUrl();
  }, []);

  // Separate effect for map initialization that waits for the ref
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      console.log('🗺️ Map container ready, initializing...');
      initializeMap();
    }
  }, [mapContainer.current]);

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

  const getPreferredDriverFromUrl = () => {
    const driverId = searchParams.get('driver_id');
    const driverName = searchParams.get('driver_name');
    
    if (driverId) {
      setPreferredDriverId(driverId);
      setPreferredDriverName(driverName ? decodeURIComponent(driverName) : null);
      
      if (driverName) {
        toast({
          title: "🚗 Driver Pre-selected",
          description: `Booking with ${decodeURIComponent(driverName)}`
        });
      }
    }
  };

  const initializeMap = async () => {
    if (!mapContainer.current) {
      console.log('❌ Map container ref not available');
      return;
    }

    console.log('🗺️ Initializing map...');

    try {
      // Use the working Mapbox token
      const token = 'pk.eyJ1Ijoia3J3aWJ1dHNvIiwiYSI6ImNtZXNhMWl5aTAwbG8yanM5NzBpdHdyZnQifQ.LekbGpZ0ndO2MQSPq0jYMA';
      
      mapboxgl.accessToken = token;
      setMapboxToken(token);
      
      console.log('✅ Mapbox token set, creating map instance...');
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [30.0588, -1.9414], // Kigali, Rwanda
        zoom: 15,
        pitch: 60,
        bearing: -15,
        antialias: true,
        projection: 'globe'
      });

      console.log('✅ Map instance created');
    } catch (error) {
      console.error('❌ Error initializing map:', error);
      toast({
        title: "Map Error",
        description: "Failed to load map. Please refresh the page.",
        variant: "destructive"
      });
    }

    // Add 3D terrain and buildings
    map.current.on('load', () => {
      console.log('✅ Map loaded successfully');
      if (!map.current) return;
      
      try {
        // Add terrain source
        map.current.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        console.log('✅ Terrain source added');
      } catch (error) {
        console.error('❌ Error adding terrain:', error);
      }
      
      // Set terrain with higher exaggeration for 3D effect
      map.current.setTerrain({ 
        'source': 'mapbox-dem', 
        'exaggeration': 2.0 
      });
      
      // Add atmospheric effect
      map.current.setFog({
        'range': [2, 8],
        'color': '#ffffff',
        'high-color': '#245cdf',
        'space-color': '#000000',
        'horizon-blend': 0.1
      });
      
      // Add enhanced 3D buildings layer
      if (!map.current.getLayer('building-3d')) {
        map.current.addLayer({
          'id': 'building-3d',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 10,
          'paint': {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'height'],
              0, '#e3f2fd',
              50, '#bbdefb',
              100, '#90caf9',
              200, '#64b5f6'
            ],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              14.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              14.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.8
          }
        });
      }
      
      // Add custom destination marker layer for pin dropping animation
      map.current.loadImage('/pin-icon.png', (error, image) => {
        if (!error && image) {
          map.current?.addImage('destination-pin', image);
        }
      });
      
      // Add click handler for location selection AFTER map loads
      map.current.on('click', handleMapClick);
      console.log('✅ Click handler attached');
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    console.log('✅ Navigation controls added');
    
    // Add error handler
    map.current.on('error', (e) => {
      console.error('❌ Map error:', e);
    });
  };

  const getLocationFromUrl = () => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const address = searchParams.get('address');
    
    if (lat && lng && address) {
      const location: Location = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: decodeURIComponent(address)
      };
      
      setLocationData(prev => ({
        ...prev,
        pickupLocation: location,
        pickupAddress: location.address
      }));
      
      // Center map on pickup location
      if (map.current) {
        map.current.flyTo({
          center: [location.lng, location.lat],
          zoom: 14
        });
      }
      
      addPickupMarker(location.lng, location.lat);
    } else {
      // Fallback to current location detection
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    if (!mapState.activeSelection) {
      toast({
        title: "Select Location Type",
        description: "Please choose pickup or dropoff first",
        variant: "destructive"
      });
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 14
            });
          }
          
          // Get address
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&country=RW&types=address,poi`
            );
            const data = await response.json();
            const address = data.features?.[0]?.place_name || 'Current Location';
            
            const currentLocation: Location = {
              lat: latitude,
              lng: longitude,
              address: address
            };
            
            if (mapState.activeSelection === 'pickup') {
              setLocationData(prev => ({
                ...prev,
                pickupLocation: currentLocation,
                pickupAddress: address
              }));
              addPickupMarker(longitude, latitude);
              setMapState(prev => ({ ...prev, activeSelection: 'dropoff' }));
              toast({
                title: "✅ Pickup Set to Current Location",
                description: address
              });
            } else {
              setLocationData(prev => ({
                ...prev,
                dropoffLocation: currentLocation,
                dropoffAddress: address
              }));
              addDropoffMarker(longitude, latitude);
              setMapState(prev => ({ ...prev, activeSelection: null }));
              toast({
                title: "✅ Dropoff Set to Current Location",
                description: address
              });
            }
          } catch (error) {
            console.error('Geocoding error:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Access Denied",
            description: "Please enable location access or select location manually",
            variant: "destructive"
          });
        }
      );
    }
  };

  const handleMapClick = async (e: any) => {
    if (!mapState.activeSelection) {
      toast({
        title: "Select Location Type",
        description: "Please choose pickup or dropoff first",
        variant: "destructive"
      });
      return;
    }

    const { lng, lat } = e.lngLat;
    
    try {
      // Show loading state
      toast({
        title: "📍 Getting location...",
        description: "Please wait"
      });
      
      // Reverse geocoding to get address
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&country=RW&types=address,poi`
      );
      const data = await response.json();
      const feature = data.features?.[0];
      const address = feature?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      const newLocation: Location = { lat, lng, address };
      
      if (mapState.activeSelection === 'pickup') {
        setLocationData(prev => ({
          ...prev,
          pickupLocation: newLocation,
          pickupAddress: address
        }));
        addPickupMarker(lng, lat);
        
        toast({
          title: "✅ Pickup Location Set",
          description: address
        });
        
        // Auto-switch to dropoff selection
        setMapState(prev => ({ ...prev, activeSelection: 'dropoff', searchQuery: '' }));
      } else {
        setLocationData(prev => ({
          ...prev,
          dropoffLocation: newLocation,
          dropoffAddress: address
        }));
        addDropoffMarker(lng, lat);
        
        toast({
          title: "✅ Dropoff Location Set",
          description: address
        });
        
        // Clear selection mode
        setMapState(prev => ({ ...prev, activeSelection: null, searchQuery: '' }));
      }

      // Fly to location
      if (map.current) {
        map.current.flyTo({
          center: [lng, lat],
          zoom: 16,
          duration: 1000
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Error",
        description: "Unable to get location details",
        variant: "destructive"
      });
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
    
    // Create enhanced 3D pin marker
    const el = document.createElement('div');
    el.className = 'dropoff-marker';
    el.innerHTML = `
      <div style="
        position: relative;
        width: 30px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: bounce 0.6s ease-out;
      ">
        <div style="
          background: linear-gradient(145deg, #ef4444, #dc2626);
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounce {
        0% { transform: translateY(-30px) scale(0.8); opacity: 0; }
        50% { transform: translateY(-5px) scale(1.1); opacity: 1; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }
      .dropoff-marker:hover {
        transform: scale(1.1);
        transition: transform 0.2s ease;
      }
    `;
    document.head.appendChild(style);
    
    dropoffMarker.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(map.current);
      
    // Add popup with location info
    const popup = new mapboxgl.Popup({ 
      offset: 25,
      closeButton: false,
      closeOnClick: false 
    })
    .setHTML(`
      <div style="text-align: center; padding: 8px;">
        <strong>📍 Destination</strong><br>
        <small>${locationData.dropoffAddress}</small>
      </div>
    `);
    
    dropoffMarker.current.setPopup(popup);
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) return;
    
    setMapState(prev => ({ ...prev, isSearching: true }));
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=RW&proximity=30.0588,-1.9414&limit=5`
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
    if (!mapState.activeSelection) return;

    const [lng, lat] = feature.center;
    const address = feature.place_name;
    
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 16
      });
    }
    
    const newLocation: Location = { lat, lng, address };
    
    if (mapState.activeSelection === 'pickup') {
      setLocationData(prev => ({
        ...prev,
        pickupLocation: newLocation,
        pickupAddress: address
      }));
      addPickupMarker(lng, lat);
      setMapState(prev => ({ ...prev, activeSelection: 'dropoff', searchQuery: '', searchResults: [] }));
      
      toast({
        title: "✅ Pickup Location Set",
        description: address
      });
    } else {
      setLocationData(prev => ({
        ...prev,
        dropoffLocation: newLocation,
        dropoffAddress: address
      }));
      addDropoffMarker(lng, lat);
      setMapState(prev => ({ ...prev, activeSelection: null, searchQuery: '', searchResults: [] }));
      
      toast({
        title: "✅ Dropoff Location Set",
        description: address
      });
    }
  };

  const swapLocations = () => {
    if (!locationData.pickupLocation || !locationData.dropoffLocation) return;
    
    setLocationData(prev => ({
      ...prev,
      pickupLocation: prev.dropoffLocation,
      dropoffLocation: prev.pickupLocation,
      pickupAddress: prev.dropoffAddress,
      dropoffAddress: prev.pickupAddress
    }));
    
    // Update markers
    if (locationData.pickupLocation) {
      addDropoffMarker(locationData.pickupLocation.lng, locationData.pickupLocation.lat);
    }
    if (locationData.dropoffLocation) {
      addPickupMarker(locationData.dropoffLocation.lng, locationData.dropoffLocation.lat);
    }
    
    toast({
      title: "Locations Swapped",
      description: "Pickup and dropoff locations have been swapped"
    });
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
      toast({
        title: "Quick Details Needed",
        description: "Please enter your name and phone to book"
      });
      return;
    }
    
    await proceedWithBooking();
  };

  const handleQuickRegister = async (name: string, phone: string) => {
    setIsBooking(true);
    try {
      const tempEmail = `${phone.replace(/\D/g, '')}@temp.ridenext.com`;
      const tempPassword = `temp_${Date.now()}`;
      
      const { data, error } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            user_type: 'passenger',
            name: name,
            phone: phone,
            is_anonymous: true
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('passengers')
          .insert({
            user_id: data.user.id,
            name: name,
            phone: phone
          });

        if (profileError && !profileError.message.includes('duplicate')) {
          throw profileError;
        }

        setPassenger({ id: data.user.id, name, phone, user_id: data.user.id });
        setShowRegistration(false);
        
        toast({
          title: "✅ Account Created",
          description: "Now booking your ride..."
        });

        // Continue with booking after registration
        await proceedWithBooking(data.user.id, name);
      }
    } catch (error: any) {
      toast({
        title: "Registration Error",
        description: error.message || "Please try again",
        variant: "destructive"
      });
      setIsBooking(false);
    }
  };

  const proceedWithBooking = async (passengerId?: string, passengerName?: string) => {
    const bookingPassengerId = passengerId || passenger?.id;
    
    if (!bookingPassengerId) {
      toast({
        title: "Error",
        description: "Please enter your details to continue",
        variant: "destructive"
      });
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
      // Step 1: Create the ride
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .insert({
          passenger_id: bookingPassengerId,
          pickup_address: locationData.pickupAddress,
          dropoff_address: locationData.dropoffAddress,
          pickup_location: `(${locationData.pickupLocation.lng}, ${locationData.pickupLocation.lat})`,
          dropoff_location: `(${locationData.dropoffLocation.lng}, ${locationData.dropoffLocation.lat})`,
          estimated_fare: calculateFare(),
          distance_km: calculateDistance(),
          payment_method: locationData.paymentMethod,
          car_category_id: selectedCategory.id,
          status: 'pending'
        })
        .select()
        .single();

      if (rideError) throw rideError;

      toast({
        title: "🚗 Ride Request Sent!",
        description: "Searching for available drivers nearby..."
      });

      // Step 2: Call smart driver matching function
      try {
        const { data: matchData, error: matchError } = await supabase.functions.invoke(
          'smart-driver-matching',
          {
            body: {
              ride_id: rideData.id,
              pickup_lat: locationData.pickupLocation.lat,
              pickup_lng: locationData.pickupLocation.lng,
              car_category_id: selectedCategory.id,
              max_distance_km: 15,
              limit: 10,
              preferred_driver_id: preferredDriverId // Pass preferred driver to matching function
            }
          }
        );

        if (matchError) {
          console.error('Driver matching error:', matchError);
          // Don't fail the booking, just log the error
        } else if (matchData?.matched_drivers?.length > 0) {
          toast({
            title: "✅ Drivers Found!",
            description: `${matchData.matched_drivers.length} drivers nearby. Best match: ${matchData.matched_drivers[0].name} (ETA: ${matchData.matched_drivers[0].estimated_arrival_minutes}min)`
          });
        } else {
          toast({
            title: "⏳ Searching...",
            description: "No drivers found yet. We'll keep looking for you.",
            variant: "default"
          });
        }
      } catch (matchErr) {
        console.error('Matching function error:', matchErr);
      }

      // Step 3: Navigate to ride status page
      setTimeout(() => {
        navigate(`/passenger/ride/${rideData.id}`);
      }, 1500);

    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Unable to create ride. Please try again.",
        variant: "destructive"
      });
      console.error('Booking error:', error);
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


  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/passenger')}
              className="flex items-center gap-1.5 h-8 sm:h-10 px-2 sm:px-3"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline text-xs">Back</span>
            </Button>
            <div className="flex flex-col items-center">
              <h1 className="text-xs sm:text-sm font-semibold text-foreground">Book Your Ride</h1>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {selectedCategory.name}
              </Badge>
            </div>
            <div className="w-8 sm:w-10" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Mobile-First Layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Map Section */}
        <div className="relative flex-1 order-1 lg:order-1 bg-muted">
          <div 
            ref={mapContainer} 
            className="w-full h-[50vh] sm:h-[60vh] lg:h-screen"
            style={{ minHeight: '400px' }}
          />
          
          {/* Loading indicator */}
          {!map.current && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
          
          {/* Location Selection Controls */}
          <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-10">
            <Card className="bg-card/95 backdrop-blur-sm border-border shadow-lg">
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold">Select Locations</h3>
                    {locationData.pickupLocation && locationData.dropoffLocation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={swapLocations}
                        className="h-7 px-2"
                        title="Swap locations"
                      >
                        <Navigation className="h-3 w-3 rotate-90" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={mapState.activeSelection === 'pickup' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMapState(prev => ({ ...prev, activeSelection: 'pickup', searchQuery: '', searchResults: [] }))}
                      className="flex-1 h-auto py-2 px-2"
                    >
                      <div className="flex flex-col items-start gap-0.5 w-full min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="text-xs font-semibold">Pickup</span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-left line-clamp-1 w-full opacity-90">
                          {locationData.pickupAddress || 'Not set'}
                        </span>
                      </div>
                    </Button>
                    
                    <Button
                      variant={mapState.activeSelection === 'dropoff' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMapState(prev => ({ ...prev, activeSelection: 'dropoff', searchQuery: '', searchResults: [] }))}
                      className="flex-1 h-auto py-2 px-2"
                    >
                      <div className="flex flex-col items-start gap-0.5 w-full min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                          <span className="text-xs font-semibold">Dropoff</span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-left line-clamp-1 w-full opacity-90">
                          {locationData.dropoffAddress || 'Not set'}
                        </span>
                      </div>
                    </Button>
                  </div>

                  {mapState.activeSelection && (
                    <div className="text-center p-2 bg-primary/10 rounded-md animate-fade-in">
                      <p className="text-[11px] sm:text-xs font-medium text-primary">
                        {mapState.activeSelection === 'pickup' ? '📍 Tap map or search below' : '🎯 Tap map or search below'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Box */}
          {mapState.activeSelection && (
            <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-10 animate-fade-in">
              <Card className="bg-card/95 backdrop-blur-sm border-border shadow-lg">
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder={`Search ${mapState.activeSelection} location...`}
                        value={mapState.searchQuery}
                        onChange={(e) => {
                          setMapState(prev => ({ ...prev, searchQuery: e.target.value }));
                          if (e.target.value.length > 2) {
                            searchLocation(e.target.value);
                          } else {
                            setMapState(prev => ({ ...prev, searchResults: [] }));
                          }
                        }}
                        className="pl-8 pr-3 h-9 text-xs bg-input border-border"
                      />
                      {mapState.isSearching && (
                        <Loader2 className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Search Results */}
                    {mapState.searchResults.length > 0 && (
                      <div className="max-h-40 overflow-y-auto space-y-0.5 animate-fade-in">
                        {mapState.searchResults.map((result, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            className="w-full justify-start text-left p-2 h-auto hover:bg-accent"
                            onClick={() => selectSearchResult(result)}
                          >
                            <MapPin className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-muted-foreground" />
                            <span className="text-xs truncate">{result.place_name}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                      className="w-full h-9 text-xs"
                    >
                      <Navigation className="h-3.5 w-3.5 mr-2" />
                      Use Current Location {mapState.activeSelection === 'dropoff' && 'as Dropoff'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Booking Panel */}
        <div className="w-full lg:w-80 xl:w-96 order-2 lg:order-2 bg-card border-b lg:border-b-0 lg:border-l border-border">
          <div className="p-3 sm:p-4 space-y-3 max-h-screen overflow-y-auto">
            {/* Enhanced Trip Summary with Real-time Updates */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="truncate">{selectedCategory.name}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 flex-shrink-0">
                    {selectedCategory.passenger_capacity} seats
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-3 pb-3">
                {/* Preferred Driver Indicator */}
                {preferredDriverName && (
                  <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">Preferred Driver</p>
                        <p className="text-xs font-medium truncate">{preferredDriverName}</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Real-time Fare Display */}
                <div className="text-center p-3 bg-card rounded-lg border border-primary/20">
                  <div className="text-xs text-muted-foreground mb-1">Estimated Fare</div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary">
                    {locationData.pickupLocation && locationData.dropoffLocation 
                      ? formatCurrency(calculateFare())
                      : '---'
                    }
                  </div>
                  {locationData.pickupLocation && locationData.dropoffLocation && (
                    <div className="flex justify-center gap-3 mt-2 text-[10px] sm:text-xs text-muted-foreground">
                      <span>📏 {calculateDistance().toFixed(1)} km</span>
                      <span>⏱️ ~{Math.ceil(calculateDistance() * 2)} min</span>
                    </div>
                  )}
                </div>

                {/* Fare Breakdown */}
                {locationData.pickupLocation && locationData.dropoffLocation && (
                  <div className="space-y-1.5 p-2.5 bg-muted/30 rounded-md">
                    <div className="flex justify-between text-xs">
                      <span>Base fare</span>
                      <span className="font-medium">{formatCurrency(selectedCategory.base_fare)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Distance ({calculateDistance().toFixed(1)} km)</span>
                      <span className="font-medium">
                        {formatCurrency(calculateDistance() * selectedCategory.base_price_per_km)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(calculateFare())}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Rate per km</span>
                  <span className="font-medium">{formatCurrency(selectedCategory.base_price_per_km)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Location Details */}
            <Card>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-xs sm:text-sm">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground">Pickup</p>
                      <p className="text-xs font-medium truncate">
                        {locationData.pickupAddress || 'Current Location'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 dark:bg-red-950/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground">Drop-off</p>
                      <p className="text-xs font-medium truncate">
                        {locationData.dropoffAddress || 'Select destination'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4 flex-shrink-0" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <PaymentMethodSelector
                  paymentMethod={locationData.paymentMethod}
                  onPaymentMethodChange={(method) => setLocationData(prev => ({ ...prev, paymentMethod: method }))}
                />
              </CardContent>
            </Card>

            {/* Enhanced Book Button Section */}
            <div className="space-y-3 pt-2 border-t">
              {/* Quick Registration Form - Inline */}
              {!passenger && showRegistration && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2 px-3 pt-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Your Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-3 pb-3">
                    <div className="space-y-2">
                      <Label htmlFor="quick-name" className="text-xs">Full Name</Label>
                      <Input
                        id="quick-name"
                        placeholder="Enter your name"
                        value={locationData.tempName || ''}
                        onChange={(e) => setLocationData(prev => ({ ...prev, tempName: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quick-phone" className="text-xs">Phone Number</Label>
                      <Input
                        id="quick-phone"
                        type="tel"
                        placeholder="07XX XXX XXX"
                        value={locationData.tempPhone || ''}
                        onChange={(e) => setLocationData(prev => ({ ...prev, tempPhone: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (locationData.tempName && locationData.tempPhone) {
                          handleQuickRegister(locationData.tempName, locationData.tempPhone);
                        }
                      }}
                      disabled={!locationData.tempName || !locationData.tempPhone || isBooking}
                      className="w-full h-10"
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 mr-2" />
                          Continue & Book Ride
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Booking Status Indicator */}
              {!locationData.dropoffLocation ? (
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="text-amber-800 dark:text-amber-200 text-xs font-medium mb-1">
                    📍 Select Your Destination
                  </div>
                  <div className="text-amber-600 dark:text-amber-300 text-[10px]">
                    Use the 3D map above - click anywhere to drop your destination pin
                  </div>
                </div>
              ) : (
                <div className="text-center p-2.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="text-green-800 dark:text-green-200 text-xs font-medium">
                    ✅ Ready to Book!
                  </div>
                  <div className="text-green-600 dark:text-green-300 text-[10px] mt-0.5">
                    Fare: {formatCurrency(calculateFare())} • Distance: {calculateDistance().toFixed(1)} km
                  </div>
                </div>
              )}

              <Button
                onClick={handleBookRide}
                disabled={!locationData.pickupLocation || !locationData.dropoffLocation || isBooking}
                className={`w-full h-12 sm:h-14 text-sm sm:text-base font-semibold transition-all ${
                  locationData.pickupLocation && locationData.dropoffLocation && !isBooking
                    ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    <span className="text-xs sm:text-sm">Finding Driver...</span>
                  </>
                ) : locationData.pickupLocation && locationData.dropoffLocation ? (
                  <>
                    <Car className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="text-xs sm:text-sm">Book Ride • {formatCurrency(calculateFare())}</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="text-xs sm:text-sm">Select Locations First</span>
                  </>
                )}
              </Button>
              
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                💳 Pay with {locationData.paymentMethod} • Safe & Secure Rides
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideBooking;