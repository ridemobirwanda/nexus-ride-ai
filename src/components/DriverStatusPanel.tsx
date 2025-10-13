import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Car, 
  MapPin, 
  DollarSign, 
  Clock, 
  Gauge,
  Wifi,
  WifiOff,
  UserCheck,
  PauseCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Activity,
  Settings
} from 'lucide-react';

interface DriverStatusPanelProps {
  driverId: string;
  className?: string;
  onManageVehicle?: () => void;
  driverData?: {
    car_model: string;
    car_plate: string;
  };
}

interface DriverEarnings {
  total_earnings: number;
  total_rides: number;
  today_earnings: number;
  yesterday_earnings: number;
  this_week_earnings: number;
}

const DriverStatusPanel: React.FC<DriverStatusPanelProps> = ({ 
  driverId, 
  className, 
  onManageVehicle,
  driverData 
}) => {
  const [driverStatus, setDriverStatus] = useState<'offline' | 'available' | 'on_trip' | 'inactive'>('offline');
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [earnings, setEarnings] = useState<DriverEarnings | null>(null);
  const [isOnlineTime, setIsOnlineTime] = useState(0);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);

  // Fetch initial driver status and listen for real-time updates
  useEffect(() => {
    const fetchDriverStatus = async () => {
      try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (!userAuth.user) return;

        const { data, error } = await supabase
          .from('drivers')
          .select('status')
          .eq('user_id', userAuth.user.id)
          .maybeSingle();

        if (error) throw error;
        if (data?.status) {
          setDriverStatus(data.status);
        }
      } catch (error: any) {
        console.error('Error fetching driver status:', error);
      }
    };

    fetchDriverStatus();

    // Listen for real-time status changes
    const statusChannel = supabase
      .channel('driver-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `user_id=eq.${driverId}`
        },
        (payload: any) => {
          if (payload.new?.status) {
            console.log('Driver status updated:', payload.new.status);
            setDriverStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [driverId]);

  // Fetch driver earnings
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (!userAuth.user) return;

        const { data, error } = await supabase.rpc('get_driver_earnings_summary', {
          p_driver_user_id: userAuth.user.id,
          p_days: 30
        });

        if (error) throw error;
        setEarnings(data[0] || null);
      } catch (error: any) {
        console.error('Error fetching earnings:', error);
      }
    };

    fetchEarnings();
  }, [driverId]);

  // Track online time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (driverStatus === 'available') {
      interval = setInterval(() => {
        setIsOnlineTime(prev => prev + 1);
      }, 1000);
    } else {
      setIsOnlineTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [driverStatus]);

  // Listen for location updates
  useEffect(() => {
    const channel = supabase
      .channel('driver-location-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`
        },
        () => {
          setLastLocationUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  const updateDriverStatus = async (status: typeof driverStatus) => {
    console.log('Updating driver status to:', status);
    setIsStatusLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('update_driver_status', {
        p_status: status
      });

      if (error) {
        console.error('Error updating driver status:', error);
        throw error;
      }

      console.log('Driver status updated successfully:', data);
      setDriverStatus(status);
      
      toast({
        title: "Status Updated",
        description: `You are now ${status === 'available' ? 'available' : 'offline'}`,
      });
    } catch (error: any) {
      console.error('Failed to update driver status:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update status',
        variant: "destructive"
      });
    } finally {
      setIsStatusLoading(false);
    }
  };

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

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statusDisplay = getStatusDisplay(driverStatus);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Control Card */}
      <Card className="gradient-card card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Driver Status
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusDisplay.variant} className="gap-1">
                <statusDisplay.icon className="h-3 w-3" />
                {statusDisplay.text}
              </Badge>
              {driverStatus === 'available' && (
                <Badge variant="outline" className="gap-1">
                  <Wifi className="h-3 w-3 text-green-500" />
                  Live
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Status</label>
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
          </div>

          {/* Online Duration */}
          {driverStatus === 'available' && (
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Online Duration</span>
              </div>
              <span className="text-sm font-mono">{formatTime(isOnlineTime)}</span>
            </div>
          )}

          {/* Location Status */}
          {lastLocationUpdate && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Last Location Update</span>
              </div>
              <span className="text-muted-foreground">
                {lastLocationUpdate.toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Status Guide */}
          <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
            <div className="font-medium mb-2">Status Guide:</div>
            <div className="space-y-1">
              <div>• <strong>Available:</strong> Online and accepting ride requests</div>
              <div>• <strong>On Trip:</strong> Currently serving a passenger</div>
              <div>• <strong>Inactive:</strong> No location updates for 30+ seconds</div>
              <div>• <strong>Offline:</strong> Not visible to passengers</div>
            </div>
          </div>

          {/* Vehicle Info & Management */}
          {driverData && (
            <div className="space-y-3 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{driverData.car_model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plate</p>
                  <p className="font-medium">{driverData.car_plate}</p>
                </div>
              </div>
              
              {onManageVehicle && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={onManageVehicle}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Vehicle
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings Summary Card */}
      {earnings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Earnings Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-bold text-green-600">
                    ${earnings.today_earnings.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Today</div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-lg font-bold text-blue-600">
                    ${earnings.this_week_earnings.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">This Week</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Car className="h-4 w-4 text-purple-600" />
                  <span className="text-lg font-bold text-purple-600">
                    {earnings.total_rides}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Total Rides</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Gauge className="h-4 w-4 text-orange-600" />
                  <span className="text-lg font-bold text-orange-600">
                    ${(earnings.total_earnings / Math.max(earnings.total_rides, 1)).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Avg per Ride</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Lifetime Earnings:</span>
                <span className="font-bold text-primary">
                  ${earnings.total_earnings.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverStatusPanel;