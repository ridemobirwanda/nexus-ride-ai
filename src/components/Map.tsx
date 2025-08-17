import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation } from 'lucide-react';

interface MapProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }, type: 'pickup' | 'dropoff') => void;
  pickupLocation?: { lat: number; lng: number; address: string };
  dropoffLocation?: { lat: number; lng: number; address: string };
  drivers?: Array<{ id: string; lat: number; lng: number; name: string }>;
  className?: string;
}

const Map: React.FC<MapProps> = ({ 
  onLocationSelect, 
  pickupLocation, 
  dropoffLocation, 
  drivers = [],
  className = "h-96"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [locationMode, setLocationMode] = useState<'pickup' | 'dropoff' | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.5, 40], // Default to NYC area
      zoom: 9
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click handler for location selection
    if (onLocationSelect) {
      map.current.on('click', async (e) => {
        if (!locationMode) return;
        
        const { lng, lat } = e.lngLat;
        
        // Reverse geocoding (simplified - in real app would use Mapbox Geocoding API)
        const address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        onLocationSelect({ lat, lng, address }, locationMode);
        setLocationMode(null);
      });
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, onLocationSelect, locationMode]);

  // Add markers when locations change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add pickup marker
    if (pickupLocation) {
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat([pickupLocation.lng, pickupLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<div>Pickup: ${pickupLocation.address}</div>`))
        .addTo(map.current);
    }

    // Add dropoff marker
    if (dropoffLocation) {
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([dropoffLocation.lng, dropoffLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<div>Dropoff: ${dropoffLocation.address}</div>`))
        .addTo(map.current);
    }

    // Add driver markers
    drivers.forEach(driver => {
      new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([driver.lng, driver.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<div>Driver: ${driver.name}</div>`))
        .addTo(map.current);
    });

    // Fit map to show all markers
    if (pickupLocation || dropoffLocation || drivers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      if (pickupLocation) bounds.extend([pickupLocation.lng, pickupLocation.lat]);
      if (dropoffLocation) bounds.extend([dropoffLocation.lng, dropoffLocation.lat]);
      drivers.forEach(driver => bounds.extend([driver.lng, driver.lat]));
      
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [pickupLocation, dropoffLocation, drivers]);

  if (showTokenInput) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted rounded-lg`}>
        <div className="text-center p-6 max-w-md">
          <h3 className="text-lg font-semibold mb-4">Connect Mapbox</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your Mapbox token in Supabase Edge Function Secrets to enable maps.
          </p>
          <div className="bg-background/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <MapPin className="h-8 w-8" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Demo mode: Map functionality requires Mapbox integration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
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