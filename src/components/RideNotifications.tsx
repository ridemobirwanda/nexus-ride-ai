import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Bell, Car, CheckCircle, X, Clock } from 'lucide-react';

interface RideNotificationsProps {
  userId?: string;
}

const RideNotifications = ({ userId }: RideNotificationsProps) => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Set up real-time notifications for ride updates
    const channel = supabase
      .channel('ride-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides'
        },
        (payload) => {
          const { old, new: newRecord } = payload;
          
          // Only show notifications for status changes
          if (old.status !== newRecord.status) {
            showRideStatusNotification(newRecord.status, newRecord.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          // Show notification for new chat messages
          if (payload.new.sender_type === 'driver') {
            toast({
              title: "New Message",
              description: "Your driver sent you a message",
              action: (
                <button 
                  onClick={() => window.location.href = `/passenger/chat/${payload.new.ride_id}`}
                  className="text-sm underline"
                >
                  View
                </button>
              ),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const showRideStatusNotification = (status: string, rideId: string) => {
    const getNotificationConfig = (status: string) => {
      switch (status) {
        case 'accepted':
          return {
            title: "Driver Found!",
            description: "Your ride has been accepted by a driver",
            icon: <Car className="h-4 w-4" />,
            variant: 'default' as const
          };
        case 'in_progress':
          return {
            title: "Ride Started",
            description: "Your ride is now in progress",
            icon: <Clock className="h-4 w-4" />,
            variant: 'default' as const
          };
        case 'completed':
          return {
            title: "Ride Completed",
            description: "Your ride has been completed. Please rate your experience.",
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'default' as const,
            action: (
              <button 
                onClick={() => window.location.href = `/passenger/rate/${rideId}`}
                className="text-sm underline"
              >
                Rate Ride
              </button>
            )
          };
        case 'cancelled':
          return {
            title: "Ride Cancelled",
            description: "Your ride has been cancelled",
            icon: <X className="h-4 w-4" />,
            variant: 'destructive' as const
          };
        default:
          return null;
      }
    };

    const config = getNotificationConfig(status);
    if (config) {
      toast({
        title: config.title,
        description: config.description,
        variant: config.variant,
        action: config.action,
      });
    }
  };

  return null; // This component only handles notifications, no UI
};

export default RideNotifications;