import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Car, Box, Map as MapIcon } from 'lucide-react';
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
      style: 'mapbox://styles/mapbox/light-v11',
      center: defaultCenter,
      zoom: is3D ? 15 : 12,
      pitch: is3D ? 45 : 0,
      bearing: is3D ? -17.6 : 0,
      projection: is3D ? 'globe' : 'mercator'
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

    // Add 3D buildings and atmosphere when in 3D mode
    map.current.on('style.load', () => {
      if (!map.current) return;
      
      if (is3D) {
        // Add 3D buildings
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
            minzoom: 15,
            paint: {
              'fill-extrusion-color': 'hsl(var(--muted))',
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
          },
          labelLayerId
        );

        // Add atmosphere and fog
        map.current.setFog({
          color: 'rgb(186, 210, 235)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.6
        });
      }
    });

    // Add click handler for location selection
    if (onLocationSelect) {
      map.current.on('click', async (e) => {
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
        
        onLocationSelect({ lat, lng, address }, locationMode);
        setLocationMode(null);
      });
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [onLocationSelect, locationMode, is3D]);

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
      
      {/* 2D/3D Toggle Button */}
      <div className="absolute top-4 right-4">
        <Button
          variant={is3D ? 'default' : 'secondary'}
          size="sm"
          onClick={toggle3DView}
          className="flex items-center gap-2"
        >
          {is3D ? <Box className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
          {is3D ? '3D' : '2D'}
        </Button>
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