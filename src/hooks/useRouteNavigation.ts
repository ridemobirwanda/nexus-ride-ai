import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Coordinate {
  lat: number;
  lng: number;
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
    bearing_after?: number;
    bearing_before?: number;
  };
}

interface RouteData {
  coordinates: [number, number][];
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
}

export const useRouteNavigation = () => {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-mapbox-token');
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
      }
    };
    fetchToken();
  }, []);

  const fetchRoute = useCallback(async (
    origin: Coordinate,
    destination: Coordinate,
    waypoints?: Coordinate[]
  ): Promise<RouteData | null> => {
    if (!mapboxToken) {
      setError('Mapbox token not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build coordinates string
      let coords = `${origin.lng},${origin.lat}`;
      
      if (waypoints?.length) {
        waypoints.forEach(wp => {
          coords += `;${wp.lng},${wp.lat}`;
        });
      }
      
      coords += `;${destination.lng},${destination.lat}`;

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?` +
        `access_token=${mapboxToken}&` +
        `geometries=geojson&` +
        `overview=full&` +
        `steps=true&` +
        `voice_instructions=true&` +
        `banner_instructions=true&` +
        `annotations=duration,distance,speed`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }

      const data = await response.json();
      
      if (!data.routes?.length) {
        throw new Error('No route found');
      }

      const routeData = data.routes[0];
      const legs = routeData.legs || [];
      
      // Extract all steps from all legs
      const steps: RouteStep[] = [];
      legs.forEach((leg: any) => {
        leg.steps?.forEach((step: any) => {
          steps.push({
            instruction: step.maneuver?.instruction || '',
            distance: step.distance,
            duration: step.duration,
            maneuver: {
              type: step.maneuver?.type || '',
              modifier: step.maneuver?.modifier,
              bearing_after: step.maneuver?.bearing_after,
              bearing_before: step.maneuver?.bearing_before
            }
          });
        });
      });

      const routeResult: RouteData = {
        coordinates: routeData.geometry.coordinates,
        distance: routeData.distance,
        duration: routeData.duration,
        steps
      };

      setRoute(routeResult);
      setCurrentStepIndex(0);
      return routeResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Route fetch error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [mapboxToken]);

  const nextStep = useCallback(() => {
    if (route && currentStepIndex < route.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [route, currentStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setCurrentStepIndex(0);
    setError(null);
  }, []);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)} sec`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const getManeuverIcon = (type: string, modifier?: string): string => {
    const icons: Record<string, string> = {
      'turn-left': '↰',
      'turn-right': '↱',
      'turn-sharp-left': '⮢',
      'turn-sharp-right': '⮣',
      'turn-slight-left': '↖',
      'turn-slight-right': '↗',
      'straight': '↑',
      'depart': '🚗',
      'arrive': '🏁',
      'roundabout': '↻',
      'rotary': '↻',
      'merge': '⤵',
      'fork': '⑂',
      'exit roundabout': '↱',
      'ramp': '⤴'
    };

    if (modifier) {
      const key = `${type}-${modifier}`.toLowerCase();
      if (icons[key]) return icons[key];
    }
    
    return icons[type] || '→';
  };

  return {
    route,
    isLoading,
    error,
    currentStep: route?.steps[currentStepIndex] || null,
    currentStepIndex,
    totalSteps: route?.steps.length || 0,
    fetchRoute,
    nextStep,
    prevStep,
    clearRoute,
    formatDistance,
    formatDuration,
    getManeuverIcon,
    hasToken: !!mapboxToken
  };
};
