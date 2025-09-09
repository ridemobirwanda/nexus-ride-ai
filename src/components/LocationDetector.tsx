import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { toast } from '@/hooks/use-toast';

interface LocationDetectorProps {
  onLocationDetected: (location: { lat: number; lng: number; address: string }) => void;
  autoDetect?: boolean;
}

const LocationDetector: React.FC<LocationDetectorProps> = ({ 
  onLocationDetected, 
  autoDetect = true 
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const { getCurrentLocation, isLoading } = useCurrentLocation({ autoFetch: false });

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      const location = await getCurrentLocation();
      onLocationDetected({
        lat: location.latitude,
        lng: location.longitude,
        address: location.address
      });
      
      toast({
        title: "Location Detected",
        description: location.address,
      });
    } catch (error) {
      toast({
        title: "Location Error",
        description: "Could not detect your location. Please check permissions.",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // Auto-detect on mount if enabled
  useEffect(() => {
    if (autoDetect) {
      handleDetectLocation();
    }
  }, [autoDetect]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Current Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isDetecting || isLoading ? "Detecting your location..." : "Tap to detect location"}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDetectLocation}
            disabled={isDetecting || isLoading}
          >
            {(isDetecting || isLoading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Detect Location
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationDetector;