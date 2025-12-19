import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';

const DriverChat = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [driverId, setDriverId] = useState<string>('');
  const [passengerInfo, setPassengerInfo] = useState<{
    name: string;
    phone?: string;
    photo?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!rideId) return;

      try {
        // Get current driver ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/driver/auth');
          return;
        }

        const { data: driverData } = await supabase
          .from('drivers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (driverData) {
          setDriverId(driverData.id);
        }

        // Fetch ride with passenger info
        const { data: rideData, error } = await supabase
          .from('rides')
          .select(`
            id,
            passenger_id,
            passengers!rides_passenger_id_fkey(name, phone, profile_pic)
          `)
          .eq('id', rideId)
          .single();

        if (error) throw error;

        const passenger = rideData?.passengers as { name: string; phone?: string; profile_pic?: string } | null;
        if (passenger) {
          setPassengerInfo({
            name: passenger.name,
            phone: passenger.phone,
            photo: passenger.profile_pic
          });
        }
      } catch (error: any) {
        console.error('Error fetching chat data:', error);
        toast({
          title: "Error",
          description: "Could not load chat",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [rideId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rideId || !driverId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Chat not available</p>
      </div>
    );
  }

  return (
    <ChatInterface
      rideId={rideId}
      userType="driver"
      userId={driverId}
      otherPartyName={passengerInfo?.name || 'Passenger'}
      otherPartyPhone={passengerInfo?.phone}
      otherPartyPhoto={passengerInfo?.photo}
      onBack={() => navigate(`/driver/ride/${rideId}`)}
    />
  );
};

export default DriverChat;
