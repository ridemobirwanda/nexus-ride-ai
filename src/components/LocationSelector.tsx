import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import CurrentLocationButton from '@/components/CurrentLocationButton';
import { MapPin, Navigation } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface LocationSelectorProps {
  pickupAddress: string;
  dropoffAddress: string;
  onPickupAddressChange: (address: string) => void;
  onDropoffAddressChange: (address: string) => void;
  onLocationFound: (location: Location) => void;
  disabled?: boolean;
}

const LocationSelector = ({
  pickupAddress,
  dropoffAddress,
  onPickupAddressChange,
  onDropoffAddressChange,
  onLocationFound,
  disabled = false
}: LocationSelectorProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="pickup">Pickup Location</Label>
        <div className="space-y-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="pickup"
              placeholder="Select on map or enter pickup location"
              className="pl-10"
              value={pickupAddress}
              onChange={(e) => onPickupAddressChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          {!disabled && (
            <CurrentLocationButton
              onLocationFound={onLocationFound}
              className="w-full"
            />
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="dropoff">Dropoff Location</Label>
        <div className="relative">
          <Navigation className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="dropoff"
            placeholder="Select on map or enter destination"
            className="pl-10"
            value={dropoffAddress}
            onChange={(e) => onDropoffAddressChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
};

export default LocationSelector;