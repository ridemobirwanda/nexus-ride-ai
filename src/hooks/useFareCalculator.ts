import { useMemo } from 'react';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface CarCategory {
  base_fare: number;
  base_price_per_km: number;
  minimum_fare: number;
  passenger_capacity: number;
}

export const useFareCalculator = (
  pickupLocation: Location | null,
  dropoffLocation: Location | null,
  selectedCarCategory: CarCategory | null
) => {
  const distance = useMemo(() => {
    if (!pickupLocation || !dropoffLocation) return 0;
    
    // Calculate distance using Haversine formula
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Radius of Earth in km
    
    const lat1 = pickupLocation.lat;
    const lon1 = pickupLocation.lng;
    const lat2 = dropoffLocation.lat;
    const lon2 = dropoffLocation.lng;
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }, [pickupLocation, dropoffLocation]);

  const estimatedFare = useMemo(() => {
    if (!pickupLocation || !dropoffLocation || !selectedCarCategory) return 0;
    
    // Calculate fare: base_fare + (distance * price_per_km * passenger_capacity)
    const farePerKm = selectedCarCategory.base_price_per_km * selectedCarCategory.passenger_capacity;
    const calculatedFare = selectedCarCategory.base_fare + (distance * farePerKm);
    return Math.max(calculatedFare, selectedCarCategory.minimum_fare);
  }, [distance, selectedCarCategory]);

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} RWF`;
  };

  return {
    distance,
    estimatedFare,
    formatCurrency
  };
};