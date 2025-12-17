import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, ArrowRight, Loader2 } from 'lucide-react';

interface ActiveRide {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_fare: number;
  driver?: {
    name: string;
    car_model?: string;
    car_plate?: string;
  };
}

interface ActiveRideCardProps {
  ride: ActiveRide;
}

const ActiveRideCard = ({ ride }: ActiveRideCardProps) => {
  const navigate = useNavigate();

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          text: 'Finding Driver...', 
          color: 'bg-amber-500',
          icon: <Loader2 className="h-3 w-3 animate-spin" />
        };
      case 'accepted':
        return { 
          text: 'Driver En Route', 
          color: 'bg-blue-500',
          icon: null
        };
      case 'in_progress':
        return { 
          text: 'Ride In Progress', 
          color: 'bg-green-500',
          icon: null
        };
      default:
        return { 
          text: status, 
          color: 'bg-gray-500',
          icon: null
        };
    }
  };

  const statusInfo = getStatusInfo(ride.status);

  return (
    <Card className="border-primary/30 bg-primary/5 animate-pulse-subtle">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={`${statusInfo.color} text-white gap-1`}>
              {statusInfo.icon}
              {statusInfo.text}
            </Badge>
          </div>
          <span className="text-sm font-semibold text-primary">
            {Math.round(ride.estimated_fare).toLocaleString()} RWF
          </span>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm line-clamp-1">{ride.pickup_address}</p>
          </div>
          <div className="flex items-start gap-2">
            <Navigation className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm line-clamp-1">{ride.dropoff_address}</p>
          </div>
        </div>

        {ride.driver && (
          <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded">
            <span className="font-medium">{ride.driver.name}</span>
            {ride.driver.car_model && (
              <span> • {ride.driver.car_model}</span>
            )}
            {ride.driver.car_plate && (
              <span> • {ride.driver.car_plate}</span>
            )}
          </div>
        )}

        <Button 
          onClick={() => navigate(`/passenger/ride/${ride.id}`)}
          className="w-full gap-2"
          variant="default"
        >
          View Ride Details
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default ActiveRideCard;
