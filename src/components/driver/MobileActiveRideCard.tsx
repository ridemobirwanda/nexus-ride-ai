import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  MessageCircle,
  User,
  DollarSign,
  Play,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Passenger {
  name: string;
  phone: string;
}

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_location: any;
  dropoff_location: any;
  status: string;
  estimated_fare: number;
  distance_km: number;
  created_at: string;
  passenger: Passenger;
}

interface MobileActiveRideCardProps {
  ride: Ride;
  onUpdateStatus: (rideId: string, status: string) => void;
  onCall: (phone: string) => void;
  onChat: (rideId: string) => void;
  onNavigate?: (address: string) => void;
}

const MobileActiveRideCard = ({
  ride,
  onUpdateStatus,
  onCall,
  onChat,
  onNavigate
}: MobileActiveRideCardProps) => {
  const isAccepted = ride.status === 'accepted';
  const isInProgress = ride.status === 'in_progress';

  const handleNavigateToAddress = (address: string) => {
    // Open in Google Maps or Apple Maps
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Navigation className="h-6 w-6 text-primary" />
            Active Ride
          </CardTitle>
          <Badge 
            className={cn(
              "text-sm",
              isAccepted ? "bg-amber-500" : "bg-green-500"
            )}
          >
            {isAccepted ? "Pickup Passenger" : "In Progress"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Passenger Info */}
        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-xl">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold">{ride.passenger.name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">${ride.estimated_fare?.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => onChat(ride.id)}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700"
              onClick={() => onCall(ride.passenger.phone)}
            >
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Locations with Navigation */}
        <div className="space-y-3">
          {/* Pickup Location */}
          <div 
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors",
              isAccepted 
                ? "bg-green-500/10 border-2 border-green-500/30 hover:bg-green-500/20" 
                : "bg-muted/30"
            )}
            onClick={() => isAccepted && handleNavigateToAddress(ride.pickup_address)}
          >
            <MapPin className={cn(
              "h-6 w-6 mt-0.5 flex-shrink-0",
              isAccepted ? "text-green-500" : "text-muted-foreground"
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                {isAccepted ? "NAVIGATE TO PICKUP" : "PICKUP"}
              </p>
              <p className="text-sm font-medium leading-tight">{ride.pickup_address}</p>
            </div>
            {isAccepted && (
              <ExternalLink className="h-5 w-5 text-green-500 flex-shrink-0" />
            )}
          </div>

          {/* Dropoff Location */}
          <div 
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors",
              isInProgress 
                ? "bg-primary/10 border-2 border-primary/30 hover:bg-primary/20" 
                : "bg-muted/30"
            )}
            onClick={() => isInProgress && handleNavigateToAddress(ride.dropoff_address)}
          >
            <Navigation className={cn(
              "h-6 w-6 mt-0.5 flex-shrink-0",
              isInProgress ? "text-primary" : "text-muted-foreground"
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                {isInProgress ? "NAVIGATE TO DROPOFF" : "DROPOFF"}
              </p>
              <p className="text-sm leading-tight">{ride.dropoff_address}</p>
            </div>
            {isInProgress && (
              <ExternalLink className="h-5 w-5 text-primary flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {isAccepted && (
            <Button
              size="lg"
              className="w-full min-h-[56px] text-base bg-green-600 hover:bg-green-700"
              onClick={() => onUpdateStatus(ride.id, 'in_progress')}
            >
              <Play className="h-6 w-6 mr-2" />
              Start Ride - Passenger Picked Up
            </Button>
          )}
          {isInProgress && (
            <Button
              size="lg"
              className="w-full min-h-[56px] text-base"
              onClick={() => onUpdateStatus(ride.id, 'completed')}
            >
              <CheckCircle2 className="h-6 w-6 mr-2" />
              Complete Ride - Arrived at Destination
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileActiveRideCard;
