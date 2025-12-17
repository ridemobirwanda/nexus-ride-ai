import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationPermissionBanner = () => {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show banner if notifications are supported but not granted
    const dismissed = localStorage.getItem('notification-banner-dismissed');
    if (isSupported && permission === 'default' && !dismissed) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  if (!isVisible || isDismissed || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Enable Ride Notifications</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Get instant alerts when your driver is assigned, arriving, or has arrived.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleEnable}>
              Enable
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
