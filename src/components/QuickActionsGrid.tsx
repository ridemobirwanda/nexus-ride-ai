import { Button } from '@/components/ui/button';
import { Clock, User, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActionsGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      <Button 
        variant="outline" 
        className="h-auto p-3 sm:p-4 flex-col gap-2 touch-manipulation hover:scale-105 transition-transform"
        onClick={() => navigate('/passenger/history')}
      >
        <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="text-xs sm:text-sm">Ride History</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto p-3 sm:p-4 flex-col gap-2 touch-manipulation hover:scale-105 transition-transform"
        onClick={() => navigate('/vehicles')}
      >
        <Car className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="text-xs sm:text-sm">View Vehicles</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto p-3 sm:p-4 flex-col gap-2 touch-manipulation hover:scale-105 transition-transform col-span-2 sm:col-span-1"
        onClick={() => navigate('/passenger/profile')}
      >
        <User className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="text-xs sm:text-sm">Profile</span>
      </Button>
    </div>
  );
};

export default QuickActionsGrid;