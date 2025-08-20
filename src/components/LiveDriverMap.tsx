import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDriverLocationSubscription } from '@/hooks/useDriverLocationSubscription';
import { 
  MapPin, 
  Car, 
  Navigation, 
  Gauge, 
  Users,
  RefreshCw,
  Clock
} from 'lucide-react';

interface LiveDriverMapProps {
  rideId?: string;
  className?: string;
  showAllDrivers?: boolean;
}

const LiveDriverMap: React.FC<LiveDriverMapProps> = ({ 
  rideId, 
  className, 
  showAllDrivers = true 
}) => {
  const { driverLocations, isLoading, error } = useDriverLocationSubscription(rideId);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return `${Math.floor(diffSecs / 3600)}h ago`;
  };

  const formatSpeed = (speed: number | undefined) => 
    speed ? `${(speed * 3.6).toFixed(1)} km/h` : 'N/A';

  const formatHeading = (heading: number | undefined) => {
    if (heading === undefined) return 'N/A';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return `${Math.round(heading)}° ${directions[index]}`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Live Drivers...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Connecting to live driver data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <MapPin className="h-5 w-5" />
            Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Drivers
          </div>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {driverLocations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {driverLocations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <div className="text-sm">No drivers are currently online</div>
          </div>
        ) : (
          <div className="space-y-3">
            {driverLocations.map((driver) => (
              <div
                key={driver.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedDriver === driver.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
                onClick={() => setSelectedDriver(
                  selectedDriver === driver.id ? null : driver.id
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{driver.driver?.name || 'Unknown Driver'}</h4>
                    {driver.driver?.car_model && (
                      <div className="text-sm text-muted-foreground">
                        {driver.driver.car_model}
                        {driver.driver.car_plate && ` • ${driver.driver.car_plate}`}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(driver.timestamp)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <div className="font-mono text-xs">
                      {driver.location[1].toFixed(4)}, {driver.location[0].toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Accuracy:</span>
                    <div>±{driver.accuracy ? Math.round(driver.accuracy) : 'N/A'}m</div>
                  </div>
                </div>

                {selectedDriver === driver.id && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {driver.speed !== undefined && (
                        <div className="flex items-center gap-2">
                          <Gauge className="h-3 w-3 text-muted-foreground" />
                          <span>{formatSpeed(driver.speed)}</span>
                        </div>
                      )}
                      
                      {driver.heading !== undefined && (
                        <div className="flex items-center gap-2">
                          <Navigation className="h-3 w-3 text-muted-foreground" />
                          <span>{formatHeading(driver.heading)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      Driver ID: {driver.driver_id}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveDriverMap;