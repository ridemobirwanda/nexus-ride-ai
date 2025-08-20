import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Navigation, 
  Play, 
  Square, 
  Gauge,
  Clock,
  Wifi,
  WifiOff,
  UserCheck,
  Car,
  PauseCircle,
  AlertCircle
} from 'lucide-react';

interface LocationTrackerProps {
  className?: string;
}

const LocationTracker: React.FC<LocationTrackerProps> = ({ className }) => {
  const { 
    location,
    isTracking, 
    error, 
    startTracking, 
    stopTracking,
    lastUploadedLocation
  } = useLocationTracking({
    enableHighAccuracy: true,
    updateInterval: 3000,
    minimumDistance: 5
  });
  
  const [driverStatus, setDriverStatus] = useState<'offline' | 'available' | 'on_trip' | 'inactive'>('offline');
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [trackingDuration, setTrackingDuration] = useState(0);

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

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update driver status
  const updateDriverStatus = async (status: typeof driverStatus) => {
    setIsStatusLoading(true);
    try {
      const { data, error } = await supabase.rpc('update_driver_status', {
        p_status: status
      });

      if (error) throw error;

      setDriverStatus(status);
      
      // Auto start/stop tracking based on status
      if (status === 'available' && !isTracking) {
        startTracking();
        toast({
          title: "Location Tracking Started",
          description: "Your location is now being shared with passengers",
        });
      } else if (status === 'offline' && isTracking) {
        stopTracking();
        toast({
          title: "Location Tracking Stopped",  
          description: "You are no longer sharing your location",
        });
      }

      toast({
        title: "Status Updated",
        description: `Driver status set to ${status.replace('_', ' ')}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsStatusLoading(false);
    }
  };

  // Get status badge variant and icon
  const getStatusDisplay = (status: typeof driverStatus) => {
    switch (status) {
      case 'offline':
        return { variant: 'secondary' as const, icon: WifiOff, text: 'Offline', color: 'text-muted-foreground' };
      case 'available':
        return { variant: 'default' as const, icon: UserCheck, text: 'Available', color: 'text-green-500' };
      case 'on_trip':
        return { variant: 'destructive' as const, icon: Car, text: 'On Trip', color: 'text-blue-500' };
      case 'inactive':
        return { variant: 'outline' as const, icon: PauseCircle, text: 'Inactive', color: 'text-yellow-500' };
      default:
        return { variant: 'secondary' as const, icon: AlertCircle, text: 'Unknown', color: 'text-muted-foreground' };
    }
  };

  const statusDisplay = getStatusDisplay(driverStatus);

  const formatCoordinate = (coord: number) => coord.toFixed(6);
  const formatSpeed = (speed: number | undefined) => 
    speed ? `${(speed * 3.6).toFixed(1)} km/h` : 'N/A';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Driver Status & Location
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusDisplay.variant} className="gap-1">
              <statusDisplay.icon className="h-3 w-3" />
              {statusDisplay.text}
            </Badge>
            {isTracking && (
              <Badge variant="outline" className="gap-1">
                <Wifi className="h-3 w-3 text-green-500" />
                Live
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Control */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Driver Status</label>
          <Select 
            value={driverStatus} 
            onValueChange={updateDriverStatus}
            disabled={isStatusLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="offline">
                <div className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4" />
                  Offline
                </div>
              </SelectItem>
              <SelectItem value="available">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Available
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {driverStatus === 'available' && 'You are visible to passengers and can receive ride requests'}
            {driverStatus === 'offline' && 'You are not visible to passengers'}
            {driverStatus === 'on_trip' && 'Currently on a trip - automatically managed'}
            {driverStatus === 'inactive' && 'Inactive due to no location updates'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Tracking Duration */}
        {isTracking && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Tracking Duration</span>
            </div>
            <span className="text-sm font-mono">{formatTime(trackingDuration)}</span>
          </div>
        )}

        {/* Location Info */}
        {location && (
          <div className="p-3 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Navigation className="h-4 w-4" />
              Current Location
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Latitude:</span>
                <div className="font-mono">{formatCoordinate(location.latitude)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Longitude:</span>
                <div className="font-mono">{formatCoordinate(location.longitude)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Accuracy:</span>
                <div>±{Math.round(location.accuracy || 0)}m</div>
              </div>
              <div>
                <span className="text-muted-foreground">Speed:</span>
                <div>{formatSpeed(location.speed)}</div>
              </div>
            </div>
            
            {location.heading !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="h-3 w-3 text-muted-foreground" />
                <span>Heading: {Math.round(location.heading)}°</span>
              </div>
            )}

            {/* Upload Status */}
            {lastUploadedLocation && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                Last upload: {formatCoordinate(lastUploadedLocation.latitude)}, {formatCoordinate(lastUploadedLocation.longitude)}
              </div>
            )}
          </div>
        )}

        {/* Manual Controls - only show if not auto-managed by status */}
        {driverStatus !== 'on_trip' && (
          <div className="flex gap-2">
            {!isTracking ? (
              <Button 
                onClick={() => {
                  startTracking();
                  toast({
                    title: "Location Tracking Started",
                    description: "Your location is now being shared",
                  });
                }}
                className="flex-1"
                disabled={driverStatus === 'offline'}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Tracking
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  stopTracking();
                  toast({
                    title: "Location Tracking Stopped",
                    description: "You are no longer sharing your location",
                  });
                }}
                variant="outline" 
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Tracking
              </Button>
            )}
          </div>
        )}

        {/* Status explanation */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
          <div className="font-medium mb-1">Status Guide:</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserCheck className="h-3 w-3 text-green-500" />
              <span><strong>Available:</strong> Online and accepting ride requests</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-3 w-3 text-blue-500" />
              <span><strong>On Trip:</strong> Currently serving a passenger</span>
            </div>
            <div className="flex items-center gap-2">
              <PauseCircle className="h-3 w-3 text-yellow-500" />
              <span><strong>Inactive:</strong> No location updates for 30+ seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <WifiOff className="h-3 w-3 text-muted-foreground" />
              <span><strong>Offline:</strong> Not visible to passengers</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {!isTracking && !error && driverStatus === 'offline' && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            Set your status to "Available" to start sharing your location with passengers and receive ride requests.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationTracker;