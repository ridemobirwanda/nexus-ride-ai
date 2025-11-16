import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutoDispatchConfig {
  enabled: boolean;
  timeout?: number; // milliseconds
}

export const useAutoDispatch = (config: AutoDispatchConfig = { enabled: true, timeout: 5000 }) => {
  const { toast } = useToast();

  const triggerAutoDispatch = useCallback(async (rideId: string) => {
    if (!config.enabled) {
      console.log('Auto-dispatch is disabled');
      return null;
    }

    try {
      console.log(`Triggering auto-dispatch for ride: ${rideId}`);
      
      const { data, error } = await supabase.functions.invoke('auto-dispatch-ride', {
        body: { ride_id: rideId }
      });

      if (error) {
        console.error('Auto-dispatch error:', error);
        toast({
          title: "Auto-Dispatch Failed",
          description: error.message || "Failed to automatically assign driver",
          variant: "destructive",
        });
        return null;
      }

      if (data?.success) {
        console.log('Auto-dispatch successful:', data);
        toast({
          title: "Driver Assigned",
          description: `${data.driver.name} has been automatically assigned to your ride`,
        });
        return data;
      }

      if (data?.message === 'No drivers available') {
        console.log('No drivers available for auto-dispatch');
        toast({
          title: "Finding Driver",
          description: "Searching for available drivers nearby...",
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error triggering auto-dispatch:', error);
      toast({
        title: "Dispatch Error",
        description: "Failed to process auto-dispatch request",
        variant: "destructive",
      });
      return null;
    }
  }, [config.enabled, toast]);

  // Listen for new pending rides and auto-dispatch them
  useEffect(() => {
    if (!config.enabled) return;

    const channel = supabase
      .channel('auto-dispatch-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rides',
          filter: 'status=eq.pending'
        },
        (payload) => {
          console.log('New pending ride detected:', payload.new);
          const rideId = (payload.new as any).id;
          
          // Trigger auto-dispatch after a short delay
          setTimeout(() => {
            triggerAutoDispatch(rideId);
          }, config.timeout || 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config.enabled, config.timeout, triggerAutoDispatch]);

  return { triggerAutoDispatch };
};
