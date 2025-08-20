import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Car } from 'lucide-react';
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
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [locationMode, setLocationMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [driverMarkers, setDriverMarkers] = useState<Record<string, mapboxgl.Marker>>({});
  
  // Get real-time driver locations
  const { driverLocations, isLoading, error } = useDriverLocationSubscription();

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

  if (showTokenInput) {
    const visibleDrivers = driverLocations.filter(driver => 
      showAllDrivers || driver.driver_id === assignedDriverId
    );
    
    return (
      <div className={`${className} flex items-center justify-center bg-muted rounded-lg`}>
        <div className="text-center p-6 max-w-md">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Car className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">Live Driver Tracking</h3>
          </div>
          <div className="bg-background/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center h-32 text-muted-foreground flex-col gap-2">
              <MapPin className="h-8 w-8" />
              {!isLoading && (
                <div className="text-sm">
                  {visibleDrivers.length} {assignedDriverId ? 'assigned driver' : 'drivers'} tracked
                </div>
              )}
              {isLoading && <div className="text-sm">Connecting to live data...</div>}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {assignedDriverId ? 'Tracking your assigned driver' : 'Showing all available drivers'}
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