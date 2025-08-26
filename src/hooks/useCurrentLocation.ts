import { useState, useEffect, useCallback } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  accuracy?: number;
}

interface UseCurrentLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoFetch?: boolean;
}

export const useCurrentLocation = (options: UseCurrentLocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000, // 1 minute
    autoFetch = true
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reverse geocoding to get street address
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      // For demo purposes, return a formatted address with main street names for Kigali area
      const kigaliStreets = [
        'KG 11 Ave', 'KG 7 Ave', 'KN 3 Rd', 'KN 5 Rd', 'KG 9 Ave',
        'Boulevard de la Revolution', 'Avenue de la Paix', 'KG 15 Ave',
        'KN 1 Rd', 'KG 3 Ave', 'Nyarugenge District', 'Gasabo District',
        'Kicukiro District', 'Remera', 'Kimisagara', 'Gikondo'
      ];
      
      // Simple approximation for Kigali coordinates
      const isInKigali = lat > -2.1 && lat < -1.8 && lng > 29.9 && lng < 30.3;
      
      if (isInKigali) {
        const randomStreet = kigaliStreets[Math.floor(Math.random() * kigaliStreets.length)];
        const streetNumber = Math.floor(Math.random() * 100) + 1;
        return `${streetNumber} ${randomStreet}, Kigali, Rwanda`;
      } else {
        // Fallback for coordinates outside Kigali
        return `${lat.toFixed(4)}, ${lng.toFixed(4)} - Unknown Location`;
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            const address = await reverseGeocode(latitude, longitude);
            
            const locationData: LocationData = {
              latitude,
              longitude,
              address,
              accuracy: accuracy || undefined
            };
            
            setLocation(locationData);
            setIsLoading(false);
            resolve(locationData);
          } catch (err) {
            const error = err instanceof Error ? err.message : 'Failed to get address';
            setError(error);
            setIsLoading(false);
            reject(new Error(error));
          }
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timeout';
              break;
          }
          
          setError(errorMessage);
          setIsLoading(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge, reverseGeocode]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      getCurrentLocation().catch(() => {
        // Error already handled in the function
      });
    }
  }, [autoFetch, getCurrentLocation]);

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    clearLocation: () => setLocation(null),
    clearError: () => setError(null)
  };
};