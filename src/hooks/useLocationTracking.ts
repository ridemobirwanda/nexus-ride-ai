import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocationData {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

interface UseLocationTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  updateInterval?: number; // in milliseconds
  minimumDistance?: number; // in meters
}

export const useLocationTracking = (options: UseLocationTrackingOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 30000,
    updateInterval = 5000, // 5 seconds
    minimumDistance = 10 // 10 meters
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUploadedLocation, setLastUploadedLocation] = useState<LocationData | null>(null);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  // Upload location to Supabase
  const uploadLocation = useCallback(async (locationData: LocationData) => {
    try {
      const { data, error } = await supabase.rpc('update_driver_location', {
        p_location: `(${locationData.longitude},${locationData.latitude})`,
        p_heading: locationData.heading || null,
        p_speed: locationData.speed || null,
        p_accuracy: locationData.accuracy || null
      });

      if (error) {
        console.error('Error uploading location:', error);
        setError(`Failed to upload location: ${error.message}`);
      } else {
        console.log('Location uploaded successfully:', data);
        setLastUploadedLocation(locationData);
        setError(null);
      }
    } catch (err) {
      console.error('Upload location error:', err);
      setError('Failed to upload location to server');
    }
  }, []);

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsTracking(true);
    setError(null);

    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    // Watch position changes
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          accuracy: position.coords.accuracy
        };

        setLocation(newLocation);

        // Check if we should upload this location update
        if (!lastUploadedLocation || 
            calculateDistance(
              newLocation.latitude, 
              newLocation.longitude,
              lastUploadedLocation.latitude, 
              lastUploadedLocation.longitude
            ) >= minimumDistance) {
          uploadLocation(newLocation);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError(`Location error: ${error.message}`);
        setIsTracking(false);
      },
      geoOptions
    );

    // Set up periodic uploads even if location hasn't changed much
    const uploadInterval = setInterval(() => {
      if (location) {
        uploadLocation(location);
      }
    }, updateInterval);

    // Cleanup function
    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(uploadInterval);
      setIsTracking(false);
    };
  }, [location, lastUploadedLocation, uploadLocation, calculateDistance, enableHighAccuracy, timeout, maximumAge, updateInterval, minimumDistance]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    setLocation(null);
    setLastUploadedLocation(null);
  }, []);

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
    lastUploadedLocation
  };
};