import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DriverLocation {
  id: string;
  driver_id: string;
  location: [number, number]; // [lng, lat]
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: string;
  is_active: boolean;
  driver?: {
    name: string;
    car_model?: string;
    car_plate?: string;
  };
}

export const useDriverLocationSubscription = (rideId?: string) => {
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: any;

    const setupRealtimeSubscription = async () => {
      try {
        const { data: initialData, error: fetchError } = await supabase
          .from('driver_locations')
          .select(`
            *,
            drivers:driver_id (
              name,
              car_model,
              car_plate
            )
          `)
          .eq('is_active', true)
          .order('timestamp', { ascending: false });

        if (fetchError) {
          console.error('Error fetching initial driver locations:', fetchError);
          setError(fetchError.message);
        } else {
          const processedData = (initialData || []).map(item => ({
            ...item,
            location: [
              typeof item.location === 'object' && item.location && 'x' in item.location && 'y' in item.location
                ? [item.location.x, item.location.y]
                : [0, 0]
            ][0] as [number, number],
            driver: Array.isArray(item.drivers) ? item.drivers[0] : item.drivers
          }));
          setDriverLocations(processedData);
        }

        // Set up real-time subscription
        channel = supabase
          .channel('driver-locations')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'driver_locations',
              filter: 'is_active=eq.true'
            },
            async (payload) => {
              console.log('Driver location change:', payload);

              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                // Fetch driver info for this location update
                const { data: driverData } = await supabase
                  .from('drivers')
                  .select('name, car_model, car_plate')
                  .eq('id', payload.new.driver_id)
                  .single();

                const newLocation: DriverLocation = {
                  id: payload.new.id,
                  driver_id: payload.new.driver_id,
                  location: [
                    typeof payload.new.location === 'object' && payload.new.location && 'x' in payload.new.location && 'y' in payload.new.location
                      ? [payload.new.location.x, payload.new.location.y]
                      : [0, 0]
                  ][0] as [number, number],
                  heading: payload.new.heading,
                  speed: payload.new.speed,
                  accuracy: payload.new.accuracy,
                  timestamp: payload.new.timestamp,
                  is_active: payload.new.is_active,
                  driver: driverData || undefined
                };

                setDriverLocations(prev => {
                  // Remove any existing location for this driver
                  const filtered = prev.filter(loc => loc.driver_id !== payload.new.driver_id);
                  // Add the new location
                  return [...filtered, newLocation];
                });
              } else if (payload.eventType === 'DELETE') {
                setDriverLocations(prev => 
                  prev.filter(loc => loc.id !== payload.old.id)
                );
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'drivers'
            },
            (payload) => {
              console.log('Driver info change:', payload);
              
              // Update driver info in existing locations
              if (payload.eventType === 'UPDATE') {
                setDriverLocations(prev => 
                  prev.map(loc => 
                    loc.driver_id === payload.new.id
                      ? {
                          ...loc,
                          driver: {
                            name: payload.new.name,
                            car_model: payload.new.car_model,
                            car_plate: payload.new.car_plate
                          }
                        }
                      : loc
                  )
                );
              }
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              setIsLoading(false);
            }
          });

      } catch (err) {
        console.error('Error setting up subscription:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [rideId]);

  return {
    driverLocations,
    isLoading,
    error
  };
};