import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { 
  MapPin, 
  Play, 
  Square, 
  Navigation, 
  Gauge, 
  Target,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface LocationTrackerProps {
  className?: string;
}

const LocationTracker: React.FC<LocationTrackerProps> = ({ className }) => {
  const { toast } = useToast();
  const [trackingDuration, setTrackingDuration] = useState(0);
  
  const {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
    lastUploadedLocation
  } = useLocationTracking({
    enableHighAccuracy: true,
    updateInterval: 3000, // Update every 3 seconds
    minimumDistance: 5 // Upload when moved 5+ meters
  });

  // Track duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking) {
      interval = setInterval(() => {
        setTrackingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setTrackingDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  const handleStartTracking = async () => {
    try {
      const cleanup = startTracking();
      if (cleanup) {
        toast({
          title: "Location Tracking Started",
          description: "Your location is now being shared with passengers",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start location tracking",
        variant: "destructive",
      });
    }
  };

  const handleStopTracking = () => {
    stopTracking();
    toast({
      title: "Location Tracking Stopped",
      description: "You are no longer sharing your location",
    });
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCoordinate = (coord: number) => coord.toFixed(6);
  const formatSpeed = (speed: number | undefined) => 
    speed ? `${(speed * 3.6).toFixed(1)} km/h` : 'N/A';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isTracking ? "default" : "secondary"} className="gap-1">
              {isTracking ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Live
                </>
              ) : (
                <>
                  <Square className="h-3 w-3" />
                  Offline
                </>
              )}
            </Badge>
            {isTracking && (
              <span className="text-sm text-muted-foreground">
                {formatDuration(trackingDuration)}
              </span>
            )}
          </div>

          <Button
            onClick={isTracking ? handleStopTracking : handleStartTracking}
            variant={isTracking ? "outline" : "default"}
            size="sm"
            className="gap-2"
          >
            {isTracking ? (
              <>
                <Square className="h-4 w-4" />
                Stop Tracking
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Tracking
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Current Location Info */}
        {location && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Latitude:</span>
                <div className="font-mono">{formatCoordinate(location.latitude)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Longitude:</span>
                <div className="font-mono">{formatCoordinate(location.longitude)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              {location.heading !== undefined && (
                <div className="flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-muted-foreground" />
                  <span>{Math.round(location.heading)}°</span>
                </div>
              )}
              
              {location.speed !== undefined && (
                <div className="flex items-center gap-1">
                  <Gauge className="h-3 w-3 text-muted-foreground" />
                  <span>{formatSpeed(location.speed)}</span>
                </div>
              )}
              
              {location.accuracy && (
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span>±{Math.round(location.accuracy)}m</span>
                </div>
              )}
            </div>

            {/* Upload Status */}
            {lastUploadedLocation && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                Last upload: {formatCoordinate(lastUploadedLocation.latitude)}, {formatCoordinate(lastUploadedLocation.longitude)}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!isTracking && !error && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            Start location tracking to share your real-time position with passengers during rides.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationTracker;