import { Button } from '@/components/ui/button';
import { Clock, User, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActionsGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button 
        variant="outline" 
        className="h-auto p-4 flex-col gap-2"
        onClick={() => navigate('/passenger/history')}
      >
        <Clock className="h-6 w-6" />
        <span>Ride History</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto p-4 flex-col gap-2"
        onClick={() => navigate('/vehicles')}
      >
        <Car className="h-6 w-6" />
        <span>View Vehicles</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto p-4 flex-col gap-2"
        onClick={() => navigate('/passenger/profile')}
      >
        <User className="h-6 w-6" />
        <span>Profile</span>
      </Button>
    </div>
  );
};

export default QuickActionsGrid;