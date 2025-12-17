import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive"
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setIsSubscribed(true);
        toast({
          title: "Notifications Enabled",
          description: "You'll receive alerts for ride updates"
        });
        return true;
      } else {
        toast({
          title: "Notifications Blocked",
          description: "Enable notifications in your browser settings",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    // Check if service worker is ready
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: { title, options }
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/pin-icon.png',
        badge: '/pin-icon.png',
        ...options
      });
    }
  }, [permission]);

  const notifyDriverAssigned = useCallback((driverName: string, carModel: string) => {
    sendNotification('Driver Assigned!', {
      body: `${driverName} is on their way in a ${carModel}`,
      tag: 'driver-assigned',
      requireInteraction: true
    });
  }, [sendNotification]);

  const notifyDriverArriving = useCallback((eta: number) => {
    sendNotification('Driver Arriving Soon!', {
      body: `Your driver will arrive in ${eta} minutes`,
      tag: 'driver-arriving'
    });
  }, [sendNotification]);

  const notifyDriverArrived = useCallback((driverName: string) => {
    sendNotification('Driver Has Arrived!', {
      body: `${driverName} is waiting at the pickup location`,
      tag: 'driver-arrived',
      requireInteraction: true
    });
  }, [sendNotification]);

  const notifyRideStarted = useCallback(() => {
    sendNotification('Ride Started!', {
      body: 'Your ride is now in progress. Enjoy your trip!',
      tag: 'ride-started'
    });
  }, [sendNotification]);

  const notifyRideCompleted = useCallback((fare: number) => {
    sendNotification('Ride Completed!', {
      body: `Your ride is complete. Total fare: ${fare.toLocaleString()} RWF`,
      tag: 'ride-completed',
      requireInteraction: true
    });
  }, [sendNotification]);

  return {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    sendNotification,
    notifyDriverAssigned,
    notifyDriverArriving,
    notifyDriverArrived,
    notifyRideStarted,
    notifyRideCompleted
  };
};

// Hook for subscribing to ride updates with push notifications
export const useRideNotifications = (rideId: string | undefined) => {
  const notifications = usePushNotifications();
  const [lastNotifiedETA, setLastNotifiedETA] = useState<number | null>(null);

  useEffect(() => {
    if (!rideId || notifications.permission !== 'granted') return;

    const channel = supabase
      .channel(`ride-notifications-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`
        },
        async (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old?.status;

          // Driver assigned
          if (newStatus === 'accepted' && oldStatus === 'pending') {
            // Fetch driver details
            const { data: ride } = await supabase
              .from('rides')
              .select('driver:drivers(name, car_model)')
              .eq('id', rideId)
              .single();
            
            if (ride?.driver) {
              notifications.notifyDriverAssigned(
                ride.driver.name,
                ride.driver.car_model || 'vehicle'
              );
            }
          }

          // Ride started
          if (newStatus === 'in_progress' && oldStatus === 'accepted') {
            notifications.notifyRideStarted();
          }

          // Ride completed
          if (newStatus === 'completed' && oldStatus === 'in_progress') {
            const fare = payload.new.final_fare || payload.new.estimated_fare;
            notifications.notifyRideCompleted(fare);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, notifications]);

  const checkETANotification = useCallback((eta: number) => {
    // Notify when ETA drops to 5 minutes or less (only once)
    if (eta <= 5 && (!lastNotifiedETA || lastNotifiedETA > 5)) {
      notifications.notifyDriverArriving(eta);
      setLastNotifiedETA(eta);
    }
  }, [lastNotifiedETA, notifications]);

  const notifyArrival = useCallback((driverName: string) => {
    notifications.notifyDriverArrived(driverName);
  }, [notifications]);

  return {
    ...notifications,
    checkETANotification,
    notifyArrival
  };
};
