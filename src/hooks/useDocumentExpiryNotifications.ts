import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ExpiryNotification {
  id: string;
  driver_id: string;
  document_type: string;
  notification_type: '30_days' | '7_days' | 'expired';
  expiry_date: string;
  is_read: boolean;
  created_at: string;
}

type NotificationType = '30_days' | '7_days' | 'expired';

const isValidNotificationType = (type: string): type is NotificationType => {
  return ['30_days', '7_days', 'expired'].includes(type);
};

export const useDocumentExpiryNotifications = (driverId: string | null) => {
  const [notifications, setNotifications] = useState<ExpiryNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!driverId) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('document_expiry_notifications')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expiry notifications:', error);
        return;
      }

      // Filter and cast to ensure type safety
      const typedData: ExpiryNotification[] = (data || [])
        .filter(n => isValidNotificationType(n.notification_type))
        .map(n => ({
          ...n,
          notification_type: n.notification_type as NotificationType,
        }));

      setNotifications(typedData);
      setUnreadCount(typedData.filter(n => !n.is_read).length);

      // Show toast for unread critical notifications
      const unreadExpired = data?.filter(n => !n.is_read && n.notification_type === 'expired');
      const unread7Days = data?.filter(n => !n.is_read && n.notification_type === '7_days');

      if (unreadExpired && unreadExpired.length > 0) {
        toast({
          title: "⚠️ Document Expired!",
          description: `Your ${getDocumentLabel(unreadExpired[0].document_type)} has expired. Please update it immediately to continue driving.`,
          variant: "destructive",
          duration: 10000,
        });
      } else if (unread7Days && unread7Days.length > 0) {
        toast({
          title: "📅 Document Expiring Soon",
          description: `Your ${getDocumentLabel(unread7Days[0].document_type)} will expire in less than 7 days.`,
          duration: 8000,
        });
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel(`expiry-notifications-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_expiry_notifications',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          const rawNotification = payload.new as any;
          if (!isValidNotificationType(rawNotification.notification_type)) return;
          
          const newNotification: ExpiryNotification = {
            ...rawNotification,
            notification_type: rawNotification.notification_type as NotificationType,
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show appropriate toast based on notification type
          const docLabel = getDocumentLabel(newNotification.document_type);
          
          if (newNotification.notification_type === 'expired') {
            toast({
              title: "⚠️ Document Expired!",
              description: `Your ${docLabel} has expired. Please update it immediately to continue driving.`,
              variant: "destructive",
              duration: 10000,
            });
          } else if (newNotification.notification_type === '7_days') {
            toast({
              title: "📅 Document Expiring Soon",
              description: `Your ${docLabel} will expire in less than 7 days. Please renew it soon.`,
              duration: 8000,
            });
          } else if (newNotification.notification_type === '30_days') {
            toast({
              title: "📋 Document Renewal Reminder",
              description: `Your ${docLabel} will expire in 30 days. Consider renewing it soon.`,
              duration: 6000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('document_expiry_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!driverId) return;

    const { error } = await supabase
      .from('document_expiry_notifications')
      .update({ is_read: true })
      .eq('driver_id', driverId)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
};

function getDocumentLabel(type: string): string {
  const labels: Record<string, string> = {
    license: "Driver's License",
    insurance: "Insurance Certificate",
    registration: "Vehicle Registration",
  };
  return labels[type] || type;
}