import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Clock, Star, MapPin } from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  car_model: string;
  car_plate: string;
  rating: number;
  distance: number;
  estimated_arrival: number;
  photo_url?: string;
  car_category: {
    name: string;
    base_fare: number;
    base_price_per_km: number;
    image_url?: string;
  };
}

interface AvailableDriversListProps {
  drivers: Driver[];
  selectedDriverId?: string;
  onDriverSelect: (driver: Driver) => void;
  formatCurrency: (amount: number) => string;
}

const AvailableDriversList: React.FC<AvailableDriversListProps> = ({
  drivers,
  selectedDriverId,
  onDriverSelect,
  formatCurrency
}) => {
  if (drivers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No drivers available in your area</p>
          <p className="text-sm text-muted-foreground mt-2">Try expanding your search radius</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Available Drivers ({drivers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {drivers.map((driver) => (
          <div
            key={driver.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedDriverId === driver.id 
                ? 'border-primary bg-primary/5 shadow-md' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onDriverSelect(driver)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Driver Avatar */}
                <div className="relative">
                  {driver.photo_url ? (
                    <img 
                      src={driver.photo_url} 
                      alt={driver.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                      <Car className="h-7 w-7 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background"></div>
                </div>

                {/* Driver Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-lg">{driver.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {driver.car_category.name}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {driver.car_model} • {driver.car_plate}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{driver.rating.toFixed(1)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{driver.estimated_arrival} min</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{driver.distance.toFixed(1)} km</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="text-right">
                <p className="font-bold text-xl text-primary">
                  {formatCurrency(driver.car_category.base_fare)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Base fare
                </p>
                <p className="text-xs text-muted-foreground">
                  +{formatCurrency(driver.car_category.base_price_per_km)}/km
                </p>
              </div>
            </div>

            {/* Car Image */}
            {driver.car_category.image_url && (
              <div className="mt-3 pt-3 border-t">
                <img 
                  src={driver.car_category.image_url} 
                  alt={driver.car_category.name}
                  className="w-full h-20 object-cover rounded-md"
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AvailableDriversList;