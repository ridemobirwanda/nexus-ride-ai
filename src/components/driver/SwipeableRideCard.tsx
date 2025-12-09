import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Navigation, 
  User, 
  Phone, 
  Car, 
  DollarSign, 
  Clock,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

interface SwipeableRideCardProps {
  ride: Ride;
  distanceToPickup: number;
  etaMinutes: number;
  onAccept: (rideId: string) => void;
  onDecline?: (rideId: string) => void;
  onCall: (phone: string) => void;
}

const SwipeableRideCard = ({
  ride,
  distanceToPickup,
  etaMinutes,
  onAccept,
  onDecline,
  onCall
}: SwipeableRideCardProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    // Limit swipe range
    const clampedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
    setSwipeOffset(clampedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    if (swipeOffset > SWIPE_THRESHOLD) {
      // Swipe right - Accept
      onAccept(ride.id);
    } else if (swipeOffset < -SWIPE_THRESHOLD && onDecline) {
      // Swipe left - Decline
      onDecline(ride.id);
    }
    
    // Reset position with animation
    setSwipeOffset(0);
  };

  const getSwipeBackground = () => {
    if (swipeOffset > 20) {
      return 'bg-green-500/20';
    } else if (swipeOffset < -20) {
      return 'bg-destructive/20';
    }
    return 'bg-muted/30';
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe Action Indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        <div className={cn(
          "flex items-center gap-2 transition-opacity duration-200",
          swipeOffset > 20 ? "opacity-100" : "opacity-0"
        )}>
          <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="h-6 w-6 text-white" />
          </div>
          <span className="text-green-500 font-semibold text-sm">Accept</span>
        </div>
        <div className={cn(
          "flex items-center gap-2 transition-opacity duration-200",
          swipeOffset < -20 ? "opacity-100" : "opacity-0"
        )}>
          <span className="text-destructive font-semibold text-sm">Decline</span>
          <div className="h-12 w-12 rounded-full bg-destructive flex items-center justify-center">
            <X className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Main Card Content */}
      <div
        ref={cardRef}
        className={cn(
          "relative p-4 rounded-xl border border-border/50 transition-all duration-200",
          getSwipeBackground(),
          isSwiping ? "transition-none" : "transition-transform"
        )}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe Hint */}
        <div className="flex justify-center mb-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Distance and ETA Badges */}
        {distanceToPickup > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="text-sm gap-1.5 bg-background/50">
              <Navigation className="h-3.5 w-3.5" />
              {distanceToPickup.toFixed(1)} km away
            </Badge>
            <Badge variant="secondary" className="text-sm gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              ~{etaMinutes} min
            </Badge>
          </div>
        )}

        {/* Passenger Info */}
        <div className="flex items-center gap-3 pb-3 border-b border-border/50">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold">{ride.passenger.name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>${ride.estimated_fare?.toFixed(2)}</span>
              <span>•</span>
              <span>{ride.distance_km?.toFixed(1) || 'N/A'} km</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-primary/10 hover:bg-primary/20"
            onClick={(e) => {
              e.stopPropagation();
              onCall(ride.passenger.phone);
            }}
          >
            <Phone className="h-5 w-5 text-primary" />
          </Button>
        </div>

        {/* Quick Preview */}
        <div className="py-3 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm line-clamp-1 flex-1">{ride.pickup_address}</p>
          </div>
          <div className="flex items-start gap-2">
            <Navigation className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm line-clamp-1 flex-1 text-muted-foreground">{ride.dropoff_address}</p>
          </div>
        </div>

        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show More Details
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 border-t border-border/50 mt-3 space-y-3">
            {/* Full Addresses */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">PICKUP</p>
                  <p className="text-sm leading-tight">{ride.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Navigation className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">DROPOFF</p>
                  <p className="text-sm leading-tight">{ride.dropoff_address}</p>
                </div>
              </div>
            </div>

            {/* Trip Stats */}
            <div className="flex items-center justify-around py-3 bg-muted/30 rounded-lg">
              <div className="text-center">
                <Car className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">{ride.distance_km?.toFixed(1)} km</p>
                <p className="text-xs text-muted-foreground">Distance</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-sm font-medium">${ride.estimated_fare?.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Fare</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">{etaMinutes} min</p>
                <p className="text-xs text-muted-foreground">ETA</p>
              </div>
            </div>

            {/* Contact Button */}
            <Button
              variant="outline"
              className="w-full min-h-[48px]"
              onClick={() => onCall(ride.passenger.phone)}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Contact Passenger
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 mt-3 border-t border-border/50">
          {onDecline && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 min-h-[52px] text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={() => onDecline(ride.id)}
            >
              <X className="h-5 w-5 mr-2" />
              Decline
            </Button>
          )}
          <Button
            size="lg"
            className="flex-1 min-h-[52px] bg-green-600 hover:bg-green-700"
            onClick={() => onAccept(ride.id)}
          >
            <Check className="h-5 w-5 mr-2" />
            Accept Ride
          </Button>
        </div>

        {/* Swipe Instruction */}
        <p className="text-center text-xs text-muted-foreground mt-3">
          Swipe right to accept • Swipe left to decline
        </p>
      </div>
    </div>
  );
};

export default SwipeableRideCard;
