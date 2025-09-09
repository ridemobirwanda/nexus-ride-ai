import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Car, Search } from 'lucide-react';

import LocationSelector from './LocationSelector';
import PaymentMethodSelector from './PaymentMethodSelector';
import RideStatusDisplay from './RideStatusDisplay';
import InlineRegistration from './InlineRegistration';
import { useFareCalculator } from '@/hooks/useFareCalculator';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface CarCategory {
  id: string;
  base_fare: number;
  base_price_per_km: number;
  minimum_fare: number;
  passenger_capacity: number;
}

interface Passenger {
  id: string;
  name: string;
}

interface RideBookingCardProps {
  passenger: Passenger | null;
  currentRide: any;
  rideData: {
    pickupAddress: string;
    dropoffAddress: string;
    paymentMethod: 'cash' | 'mobile_money' | 'card';
    pickupLocation: Location | null;
    dropoffLocation: Location | null;
    selectedCarCategory: CarCategory | null;
  };
  setRideData: (data: any) => void;
}

const RideBookingCard = ({ passenger, currentRide, rideData, setRideData }: RideBookingCardProps) => {
  const navigate = useNavigate();
  const [showRegistration, setShowRegistration] = useState(false);
  const { distance, estimatedFare, formatCurrency } = useFareCalculator(
    rideData.pickupLocation,
    rideData.dropoffLocation,
    rideData.selectedCarCategory
  );

  const handleBookRide = async () => {
    // If no passenger, show registration
    if (!passenger) {
      setShowRegistration(true);
      return;
    }

    if (!rideData.pickupLocation || !rideData.dropoffLocation) {
      toast({
        title: "Error",
        description: "Please select both pickup and dropoff locations on the map",
        variant: "destructive"
      });
      return;
    }

    if (!rideData.selectedCarCategory) {
      toast({
        title: "Error",
        description: "Please select a car category",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, use smart matching to find best driver
      toast({
        title: "Finding Drivers",
        description: "Using smart matching to find the best driver for you...",
      });

      const { data: matchingResult, error: matchingError } = await supabase.functions.invoke(
        'smart-driver-matching',
        {
          body: {
            pickup_lat: rideData.pickupLocation.lat,
            pickup_lng: rideData.pickupLocation.lng,
            max_distance_km: 10,
            max_drivers: 5
          }
        }
      );

      if (matchingError) {
        console.error('Smart matching failed:', matchingError);
        // Continue with normal booking even if smart matching fails
      } else {
        console.log('Smart matching result:', matchingResult);
        if (matchingResult.drivers.length === 0) {
          toast({
            title: "No Drivers Available",
            description: "No drivers found in your area. Please try again later.",
            variant: "destructive"
          });
          return;
        }
      }
      
      // Create a ride request with actual coordinates
      const { data, error } = await supabase
        .from('rides')
        .insert({
          passenger_id: passenger.id,
          pickup_address: rideData.pickupAddress,
          dropoff_address: rideData.dropoffAddress,
          pickup_location: `POINT(${rideData.pickupLocation.lng} ${rideData.pickupLocation.lat})`,
          dropoff_location: `POINT(${rideData.dropoffLocation.lng} ${rideData.dropoffLocation.lat})`,
          estimated_fare: estimatedFare,
          payment_method: rideData.paymentMethod,
          car_category_id: rideData.selectedCarCategory.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      const driversFound = matchingResult?.drivers?.length || 0;
      toast({
        title: "Ride Booked!",
        description: `Found ${driversFound} drivers nearby. Estimated fare: ${formatCurrency(estimatedFare)}`,
      });

      // Navigate to ride status page
      navigate(`/passenger/ride/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getCardTitle = () => {
    if (currentRide) {
      switch (currentRide.status) {
        case 'pending':
          return 'Finding Driver...';
        case 'accepted':
          return 'Driver En Route';
        default:
          return 'Ride In Progress';
      }
    }
    return 'Book a Ride';
  };

  return (
    <Card className="gradient-card card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          {getCardTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocationSelector
          pickupAddress={rideData.pickupAddress}
          dropoffAddress={rideData.dropoffAddress}
          onPickupAddressChange={(address) => setRideData({ ...rideData, pickupAddress: address })}
          onDropoffAddressChange={(address) => setRideData({ ...rideData, dropoffAddress: address })}
          onLocationFound={(location) => {
            setRideData({ 
              ...rideData, 
              pickupLocation: location, 
              pickupAddress: location.address 
            });
          }}
          disabled={!!currentRide}
        />

        <PaymentMethodSelector
          paymentMethod={rideData.paymentMethod}
          onPaymentMethodChange={(method) => setRideData({ ...rideData, paymentMethod: method })}
          disabled={!!currentRide}
        />

        {rideData.pickupLocation && rideData.dropoffLocation && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Estimated Fare:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(estimatedFare)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Distance: {distance.toFixed(1)}km • {rideData.selectedCarCategory?.passenger_capacity} passengers • Payment: {rideData.paymentMethod.replace('_', ' ')}
            </div>
            <div className="text-xs text-muted-foreground">
              Base: {formatCurrency(rideData.selectedCarCategory?.base_fare || 0)} + {formatCurrency((rideData.selectedCarCategory?.base_price_per_km || 0) * (rideData.selectedCarCategory?.passenger_capacity || 1))}/km
            </div>
          </div>
        )}

        {showRegistration && !passenger ? (
          <InlineRegistration
            onRegistrationComplete={(user) => {
              setShowRegistration(false);
              // Trigger a re-fetch of passenger data
              window.location.reload();
            }}
            title="Quick Registration"
            description="Just enter your details to book your ride"
          />
        ) : (
          <>
            {!currentRide ? (
              <Button 
                onClick={handleBookRide}
                className="w-full"
                size="lg"
                disabled={!rideData.pickupLocation || !rideData.dropoffLocation || !rideData.selectedCarCategory}
              >
                <Search className="h-4 w-4 mr-2" />
                Book Ride - {rideData.pickupLocation && rideData.dropoffLocation && rideData.selectedCarCategory ? formatCurrency(estimatedFare) : '0 RWF'}
              </Button>
            ) : (
              <RideStatusDisplay currentRide={currentRide} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RideBookingCard;