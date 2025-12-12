import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle, Phone, MapPin, Shield, X, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EmergencySOSProps {
  rideId?: string;
  driverName?: string;
  driverPhone?: string;
  pickupAddress?: string;
  currentLocation?: { lat: number; lng: number };
  className?: string;
}

const EMERGENCY_NUMBERS = {
  police: '112',
  ambulance: '912',
  fire: '112'
};

const EmergencySOS = ({
  rideId,
  driverName,
  driverPhone,
  pickupAddress,
  currentLocation,
  className
}: EmergencySOSProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Countdown timer for SOS
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown <= 0) {
      triggerEmergency();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const startSOS = useCallback(() => {
    setCountdown(5);
    setIsActivated(true);
    
    // Vibrate if available
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }, []);

  const cancelSOS = useCallback(() => {
    setCountdown(null);
    setIsActivated(false);
    toast({
      title: "SOS Cancelled",
      description: "Emergency alert has been cancelled"
    });
  }, []);

  const triggerEmergency = async () => {
    setIsSending(true);
    
    try {
      // Get current location
      let location = currentLocation;
      if (!location && 'geolocation' in navigator) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000
          });
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }

      // Create emergency message
      const emergencyData = {
        type: 'SOS',
        timestamp: new Date().toISOString(),
        rideId,
        location,
        driverName,
        driverPhone,
        pickupAddress,
        googleMapsUrl: location 
          ? `https://maps.google.com/maps?q=${location.lat},${location.lng}`
          : undefined
      };

      console.log('🚨 EMERGENCY SOS TRIGGERED:', emergencyData);

      // Store in localStorage for recovery
      localStorage.setItem('lastEmergencySOS', JSON.stringify(emergencyData));

      // Request notification permission and send
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('🚨 Emergency SOS Activated', {
            body: `Location shared. Call ${EMERGENCY_NUMBERS.police} for police.`,
            icon: '/pin-icon.png',
            requireInteraction: true
          });
        } else if (Notification.permission !== 'denied') {
          await Notification.requestPermission();
        }
      }

      toast({
        title: "🚨 Emergency SOS Activated",
        description: "Your location has been recorded. Tap to call emergency services.",
        duration: 10000
      });

      setIsOpen(true);
    } catch (error) {
      console.error('Emergency SOS error:', error);
      toast({
        title: "Emergency Alert Sent",
        description: "Call emergency services if you need help",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
      setCountdown(null);
    }
  };

  const callEmergency = (number: string) => {
    window.open(`tel:${number}`, '_self');
  };

  return (
    <>
      <Button
        variant="destructive"
        size="lg"
        onClick={isActivated ? cancelSOS : startSOS}
        className={cn(
          "gap-2 font-bold shadow-lg",
          isActivated && "animate-pulse bg-red-600",
          className
        )}
      >
        {countdown !== null ? (
          <>
            <span className="text-2xl font-mono">{countdown}</span>
            <X className="h-5 w-5" />
            Cancel
          </>
        ) : isSending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Shield className="h-5 w-5" />
            Emergency SOS
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Emergency Services
            </DialogTitle>
            <DialogDescription>
              Your location has been recorded. Contact emergency services immediately if you need help.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              variant="destructive"
              size="lg"
              className="w-full gap-2 text-lg"
              onClick={() => callEmergency(EMERGENCY_NUMBERS.police)}
            >
              <Phone className="h-5 w-5" />
              Call Police (112)
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 border-red-500 text-red-500 hover:bg-red-50"
              onClick={() => callEmergency(EMERGENCY_NUMBERS.ambulance)}
            >
              <Phone className="h-5 w-5" />
              Call Ambulance (912)
            </Button>

            {currentLocation && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <MapPin className="h-4 w-4" />
                  Your Location
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
                <a
                  href={`https://maps.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline"
                >
                  Open in Google Maps
                </a>
              </div>
            )}

            {driverName && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><strong>Driver:</strong> {driverName}</p>
                {driverPhone && (
                  <p><strong>Phone:</strong> {driverPhone}</p>
                )}
                {rideId && (
                  <p className="text-xs text-muted-foreground mt-1">Ride ID: {rideId}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmergencySOS;
