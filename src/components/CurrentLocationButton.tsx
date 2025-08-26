import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { toast } from '@/hooks/use-toast';

interface CurrentLocationButtonProps {
  onLocationFound: (location: { lat: number; lng: number; address: string }) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({
  onLocationFound,
  className = "",
  variant = "outline",
  size = "sm"
}) => {
  const { isLoading, error, getCurrentLocation } = useCurrentLocation({ autoFetch: false });

  const handleGetCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      onLocationFound({
        lat: location.latitude,
        lng: location.longitude,
        address: location.address
      });
      
      toast({
        title: "Location Found",
        description: location.address,
      });
    } catch (err) {
      toast({
        title: "Location Error",
        description: error || "Could not get your current location",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleGetCurrentLocation}
      disabled={isLoading}
      className={`flex items-center gap-2 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="h-4 w-4" />
      )}
      {isLoading ? 'Getting Location...' : 'Use Current Location'}
    </Button>
  );
};

export default CurrentLocationButton;