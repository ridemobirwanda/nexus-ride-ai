import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Ride {
  id: string;
  status: string;
}

interface RideStatusDisplayProps {
  currentRide: Ride;
}

const RideStatusDisplay = ({ currentRide }: RideStatusDisplayProps) => {
  const navigate = useNavigate();

  const getStatusMessage = () => {
    switch (currentRide.status) {
      case 'pending':
        return '🔍 Searching for drivers...';
      case 'accepted':
        return '🚗 Driver assigned and en route';
      case 'in_progress':
        return '🏁 Ride in progress';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="space-y-3">
      <div className="p-4 bg-primary/10 rounded-lg text-center">
        <div className="font-medium text-primary">
          {getStatusMessage()}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Ride ID: {currentRide.id}
        </div>
      </div>
      <Button 
        onClick={() => navigate(`/passenger/ride/${currentRide.id}`)}
        className="w-full"
        size="lg"
      >
        View Ride Details
      </Button>
    </div>
  );
};

export default RideStatusDisplay;