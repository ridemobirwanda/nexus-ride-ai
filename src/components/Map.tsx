import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Navigation, Car, Box, Map as MapIcon, Satellite, Layers, RefreshCw } from 'lucide-react';
import { useDriverLocationSubscription } from '@/hooks/useDriverLocationSubscription';

interface MapProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }, type: 'pickup' | 'dropoff') => void;
  pickupLocation?: { lat: number; lng: number; address: string };
  dropoffLocation?: { lat: number; lng: number; address: string };
  className?: string;
  assignedDriverId?: string; // If set, only show this driver
  showAllDrivers?: boolean; // Whether to show all available drivers
}

const Map: React.FC<MapProps> = ({ 
  onLocationSelect, 
  pickupLocation, 
  dropoffLocation, 
  className = "h-96",
  assignedDriverId,
  showAllDrivers = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [locationMode, setLocationMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [driverMarkers, setDriverMarkers] = useState<Record<string, mapboxgl.Marker>>({});
  const [is3D, setIs3D] = useState(false);
  const [mapStyle, setMapStyle] = useState('streets-v12');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced map styles with detailed options
  const mapStyles = {
    'streets-v12': {
      name: 'Streets (Detailed)',
      style: 'mapbox://styles/mapbox/streets-v12',
      description: 'Most detailed streets with all road names and POIs'
    },
    'satellite-streets-v12': {
      name: 'Satellite + Streets',
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      description: 'High-res satellite with street overlays'
    },
    'satellite-v9': {
      name: 'Satellite',
      style: 'mapbox://styles/mapbox/satellite-v9',
      description: 'Pure satellite imagery'
    },
    'navigation-day-v1': {
      name: 'Navigation',
      style: 'mapbox://styles/mapbox/navigation-day-v1',
      description: 'Optimized for turn-by-turn navigation'
    },
    'light-v11': {
      name: 'Light',
      style: 'mapbox://styles/mapbox/light-v11',
      description: 'Clean minimal style'
    }
  };
  
  // Get real-time driver locations
  const { driverLocations, isLoading, error } = useDriverLocationSubscription();

  // Mapbox token - integrated directly
  const MAPBOX_TOKEN = 'pk.eyJ1Ijoia3J3aWJ1dHNvIiwiYSI6ImNtZXNhMWl5aTAwbG8yanM5NzBpdHdyZnQifQ.LekbGpZ0ndO2MQSPq0jYMA';

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    // Default center to Kigali, Rwanda
    const defaultCenter: [number, number] = [30.0619, -1.9441]; // Kigali coordinates
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyles[mapStyle as keyof typeof mapStyles].style,
      center: defaultCenter,
      zoom: is3D ? 15 : 14,
      pitch: is3D ? 45 : 0,
      bearing: is3D ? -17.6 : 0,
      projection: is3D ? 'globe' : 'mercator',
      // Enhanced settings for detailed maps
      hash: false,
      attributionControl: true,
      logoPosition: 'bottom-right',
      // Optimize for high detail
      maxZoom: 22, // Allow very high zoom for detailed views
      minZoom: 1
    });

    // Try to get user's current location and center map
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.current?.setCenter([longitude, latitude]);
          map.current?.setZoom(14);
        },
        (error) => {
          console.log('Could not get current location, using default (Kigali):', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    }

    // Add navigation controls with pitch/bearing
    map.current.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true
    }), 'top-right');

    // Enhanced map configuration on style load
    map.current.on('style.load', () => {
      if (!map.current) return;
      
      // Add enhanced POI and road labeling
      addEnhancedLayers();
      
      if (is3D) {
        // Add 3D buildings with enhanced detail
        const layers = map.current.getStyle().layers;
        const labelLayerId = layers.find(
          (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
        )?.id;

        map.current.addLayer(
          {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'height'],
                0, 'hsl(var(--muted))',
                50, 'hsl(var(--primary) / 0.8)',
                200, 'hsl(var(--accent) / 0.6)'
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
          },
          labelLayerId
        );

        // Enhanced atmosphere and fog
        map.current.setFog({
          color: 'rgb(186, 210, 235)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.6
        });
      }
    });

    // Auto-refresh tiles every 10 minutes for latest data
    const refreshInterval = setInterval(() => {
      refreshMapTiles();
    }, 600000); // 10 minutes

    // Add click handler for location selection BEFORE cleanup
    let mapClickHandler: ((e: any) => void) | null = null;
    if (onLocationSelect && map.current) {
      mapClickHandler = async (e: any) => {
        if (!locationMode) return;
        const { lng, lat } = e.lngLat;

        // Generate realistic Kigali street address
        const kigaliStreets = [
          'KG 11 Ave', 'KG 7 Ave', 'KN 3 Rd', 'KN 5 Rd', 'KG 9 Ave',
          'Boulevard de la Revolution', 'Avenue de la Paix', 'KG 15 Ave',
          'KN 1 Rd', 'KG 3 Ave', 'Nyarugenge District', 'Gasabo District',
          'Kicukiro District', 'Remera', 'Kimisagara', 'Gikondo'
        ];

        const isInKigali = lat > -2.1 && lat < -1.8 && lng > 29.9 && lng < 30.3;
        let address: string;

        if (isInKigali) {
          const randomStreet = kigaliStreets[Math.floor(Math.random() * kigaliStreets.length)];
          const streetNumber = Math.floor(Math.random() * 100) + 1;
          address = `${streetNumber} ${randomStreet}, Kigali, Rwanda`;
        } else {
          address = `${lat.toFixed(4)}, ${lng.toFixed(4)} - Location`;
        }

        onLocationSelect?.({ lat, lng, address }, locationMode);
        setLocationMode(null);
      };

      map.current.on('click', mapClickHandler);
    }

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      if (mapClickHandler) {
        map.current?.off('click', mapClickHandler);
      }
      map.current?.remove();
    };
  
  }, [onLocationSelect, locationMode, is3D, mapStyle]);

  // Function to add enhanced layers for detailed mapping
  const addEnhancedLayers = () => {
    if (!map.current) return;

    // Enhanced POI visibility
    const poiLayers = [
      'poi-level-1', 'poi-level-2', 'poi-level-3',
      'transit-label', 'place-label', 'road-label'
    ];

    poiLayers.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', 'visible');
        // Increase text size for better visibility
        if (map.current.getLayer(layerId)?.type === 'symbol') {
          map.current.setPaintProperty(layerId, 'text-halo-width', 2);
          map.current.setPaintProperty(layerId, 'text-halo-color', 'rgba(255,255,255,0.8)');
        }
      }
    });

    // Enhance road labeling
    const roadLayers = ['road-label', 'road-number-shield'];
    roadLayers.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', 'visible');
        map.current.setPaintProperty(layerId, 'text-halo-width', 1.5);
      }
    });
  };

  // Function to refresh map tiles
  const refreshMapTiles = async () => {
    if (!map.current || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Force reload the style to get latest tiles
      const currentStyle = map.current.getStyle();
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();
      const currentPitch = map.current.getPitch();
      const currentBearing = map.current.getBearing();

      // Reload style with cache bypass
      await new Promise<void>((resolve) => {
        map.current?.once('style.load', () => {
          map.current?.setCenter(currentCenter);
          map.current?.setZoom(currentZoom);
          map.current?.setPitch(currentPitch);
          map.current?.setBearing(currentBearing);
          addEnhancedLayers();
          resolve();
        });
        
        map.current?.setStyle(mapStyles[mapStyle as keyof typeof mapStyles].style + `?fresh=${Date.now()}`);
      });
    } catch (error) {
      console.log('Map refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle map style changes
  const handleStyleChange = (newStyle: string) => {
    if (!map.current || newStyle === mapStyle) return;
    
    setMapStyle(newStyle);
    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();
    const currentPitch = map.current.getPitch();
    const currentBearing = map.current.getBearing();
    
    map.current.setStyle(mapStyles[newStyle as keyof typeof mapStyles].style);
    
    map.current.once('style.load', () => {
      map.current?.setCenter(currentCenter);
      map.current?.setZoom(currentZoom);
      map.current?.setPitch(currentPitch);
      map.current?.setBearing(currentBearing);
      addEnhancedLayers();
    });
  };

  // Add/update pickup and dropoff markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing pickup/dropoff markers (not driver markers)
    const existingMarkers = document.querySelectorAll('.pickup-marker, .dropoff-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add pickup marker
    if (pickupLocation) {
      const pickupMarker = new mapboxgl.Marker({ 
        color: 'hsl(142, 71%, 45%)', // accent color from design system
        className: 'pickup-marker'
      })
        .setLngLat([pickupLocation.lng, pickupLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<div><strong>Pickup:</strong><br/>${pickupLocation.address}</div>`))
        .addTo(map.current);
    }

    // Add dropoff marker
    if (dropoffLocation) {
      const dropoffMarker = new mapboxgl.Marker({ 
        color: 'hsl(0, 84%, 60%)', // destructive color from design system
        className: 'dropoff-marker'
      })
        .setLngLat([dropoffLocation.lng, dropoffLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<div><strong>Dropoff:</strong><br/>${dropoffLocation.address}</div>`))
        .addTo(map.current);
    }

    // Fit map to show all markers
    if (pickupLocation || dropoffLocation || driverLocations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      if (pickupLocation) bounds.extend([pickupLocation.lng, pickupLocation.lat]);
      if (dropoffLocation) bounds.extend([dropoffLocation.lng, dropoffLocation.lat]);
      
      // Add driver locations to bounds
      driverLocations.forEach(driver => {
        if (showAllDrivers || driver.driver_id === assignedDriverId) {
          bounds.extend([driver.location[0], driver.location[1]]);
        }
      });
      
      if (bounds._ne && bounds._sw) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [pickupLocation, dropoffLocation, driverLocations, showAllDrivers, assignedDriverId]);
  
  // Real-time driver marker updates with smooth animation
  useEffect(() => {
    if (!map.current || isLoading) return;

    // Filter drivers based on assignment
    const visibleDrivers = driverLocations.filter(driver => 
      showAllDrivers || driver.driver_id === assignedDriverId
    );

    // Update existing markers and create new ones
    const newDriverMarkers: Record<string, mapboxgl.Marker> = {};
    
    visibleDrivers.forEach(driver => {
      const existingMarker = driverMarkers[driver.driver_id];
      
      if (existingMarker) {
        // Animate existing marker to new position
        const currentLngLat = existingMarker.getLngLat();
        const newLngLat = [driver.location[0], driver.location[1]] as [number, number];
        
        // Smooth animation to new position
        existingMarker.setLngLat(newLngLat);
        
        // Update popup content
        const isAssigned = driver.driver_id === assignedDriverId;
        const statusBadge = isAssigned ? '<span style="color: #22c55e; font-weight: bold;">🚗 Your Driver</span>' : '🚕 Available';
        
        existingMarker.setPopup(
          new mapboxgl.Popup().setHTML(`
            <div>
              <div style="font-weight: bold; margin-bottom: 4px;">${driver.driver?.name || 'Driver'}</div>
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${statusBadge}</div>
              ${driver.driver?.car_model ? `<div style="font-size: 11px; color: #888;">${driver.driver.car_model}</div>` : ''}
              ${driver.speed ? `<div style="font-size: 11px; color: #888;">Speed: ${(driver.speed * 3.6).toFixed(1)} km/h</div>` : ''}
              <div style="font-size: 10px; color: #aaa; margin-top: 4px;">Updated: ${new Date(driver.timestamp).toLocaleTimeString()}</div>
            </div>
          `)
        );
        
        newDriverMarkers[driver.driver_id] = existingMarker;
      } else {
        // Create new marker
        const isAssigned = driver.driver_id === assignedDriverId;
        const markerColor = isAssigned ? 'hsl(142, 71%, 45%)' : 'hsl(212, 100%, 47%)'; // accent for assigned, primary for available
        const statusBadge = isAssigned ? '<span style="color: #22c55e; font-weight: bold;">🚗 Your Driver</span>' : '🚕 Available';
        
        const marker = new mapboxgl.Marker({ 
          color: markerColor,
          className: `driver-marker ${isAssigned ? 'assigned-driver' : 'available-driver'}`
        })
          .setLngLat([driver.location[0], driver.location[1]])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <div>
                <div style="font-weight: bold; margin-bottom: 4px;">${driver.driver?.name || 'Driver'}</div>
                <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${statusBadge}</div>
                ${driver.driver?.car_model ? `<div style="font-size: 11px; color: #888;">${driver.driver.car_model}</div>` : ''}
                ${driver.speed ? `<div style="font-size: 11px; color: #888;">Speed: ${(driver.speed * 3.6).toFixed(1)} km/h</div>` : ''}
                <div style="font-size: 10px; color: #aaa; margin-top: 4px;">Updated: ${new Date(driver.timestamp).toLocaleTimeString()}</div>
              </div>
            `)
          )
          .addTo(map.current);
        
        newDriverMarkers[driver.driver_id] = marker;
      }
    });

    // Remove markers for drivers no longer visible
    Object.keys(driverMarkers).forEach((driverId) => {
      if (!newDriverMarkers[driverId]) {
        driverMarkers[driverId].remove();
      }
    });

    setDriverMarkers(newDriverMarkers);
  }, [driverLocations, driverMarkers, assignedDriverId, showAllDrivers, isLoading]);

  // Toggle between 2D and 3D view
  const toggle3DView = () => {
    if (!map.current) return;
    
    const newIs3D = !is3D;
    setIs3D(newIs3D);
    
    if (newIs3D) {
      // Switch to 3D
      map.current.setPitch(45);
      map.current.setBearing(-17.6);
      map.current.setZoom(15);
      map.current.setProjection('globe');
    } else {
      // Switch to 2D
      map.current.setPitch(0);
      map.current.setBearing(0);
      map.current.setZoom(9);
      map.current.setProjection('mercator');
      
      // Remove 3D buildings layer if it exists
      if (map.current.getLayer('3d-buildings')) {
        map.current.removeLayer('3d-buildings');
      }
      
      // Remove fog
      map.current.setFog(null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {/* Enhanced Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        {/* Map Style Selector */}
        <Select value={mapStyle} onValueChange={handleStyleChange}>
          <SelectTrigger className="w-48 bg-card/80 backdrop-blur-lg border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(mapStyles).map(([key, style]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  {key.includes('satellite') ? <Satellite className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                  <div>
                    <div className="font-medium">{style.name}</div>
                    <div className="text-xs text-muted-foreground">{style.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            variant={is3D ? 'default' : 'secondary'}
            size="sm"
            onClick={toggle3DView}
            className="flex items-center gap-2 bg-card/80 backdrop-blur-lg"
          >
            {is3D ? <Box className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
            {is3D ? '3D' : '2D'}
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshMapTiles}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-card/80 backdrop-blur-lg"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {onLocationSelect && (
        <div className="absolute top-4 left-4 space-y-2">
          <Button
            variant={locationMode === 'pickup' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setLocationMode(locationMode === 'pickup' ? null : 'pickup')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Select Pickup
          </Button>
          <Button
            variant={locationMode === 'dropoff' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setLocationMode(locationMode === 'dropoff' ? null : 'dropoff')}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Select Dropoff
          </Button>
        </div>
      )}
      
      {locationMode && (
        <div className="absolute bottom-4 left-4 right-4 bg-card p-4 rounded-lg shadow-lg">
          <p className="text-sm text-center">
            Click on the map to select your {locationMode} location
          </p>
        </div>
      )}
    </div>
  );
};

export default Map;