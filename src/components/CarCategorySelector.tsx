import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Car, Check, Star, Users, Shield, Wind } from 'lucide-react';

interface CarCategory {
  id: string;
  name: string;
  description: string;
  base_price_per_km: number;
  base_fare: number;
  minimum_fare: number;
  features: string[];
  image_url?: string;
}

interface CarCategorySelectorProps {
  selectedCategoryId?: string;
  onCategorySelect: (category: CarCategory) => void;
  showPricing?: boolean;
  distance?: number;
  readonly?: boolean;
}

const CarCategorySelector = ({ 
  selectedCategoryId, 
  onCategorySelect, 
  showPricing = false,
  distance = 0,
  readonly = false
}: CarCategorySelectorProps) => {
  const [categories, setCategories] = useState<CarCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('car_categories')
        .select('*')
        .eq('is_active', true)
        .order('base_price_per_km', { ascending: true });

      if (error) throw error;
      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        features: Array.isArray(item.features) ? item.features.map(f => String(f)) : []
      }));
      setCategories(transformedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load car categories",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFare = (category: CarCategory, distanceKm: number) => {
    const fare = category.base_fare + (distanceKm * category.base_price_per_km);
    return Math.max(fare, category.minimum_fare);
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes('seat')) return <Users className="h-3 w-3" />;
    if (feature.toLowerCase().includes('comfort') || feature.toLowerCase().includes('luxury')) return <Star className="h-3 w-3" />;
    if (feature.toLowerCase().includes('air') || feature.toLowerCase().includes('conditioning')) return <Wind className="h-3 w-3" />;
    return <Shield className="h-3 w-3" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Loading Car Options...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          {readonly ? 'Selected Car Category' : 'Choose Car Category'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`
              relative p-4 border rounded-lg transition-all cursor-pointer
              ${selectedCategoryId === category.id 
                ? 'border-primary bg-primary/10 shadow-md' 
                : 'border-muted hover:border-primary/50 hover:bg-muted/30'
              }
              ${readonly ? 'cursor-default' : ''}
            `}
            onClick={() => !readonly && onCategorySelect(category)}
          >
            {/* Selection Indicator */}
            {selectedCategoryId === category.id && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-primary text-primary-foreground">
                  <Check className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              </div>
            )}

            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                {showPricing && distance > 0 && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      ${calculateFare(category, distance).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${category.base_price_per_km}/km
                    </div>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {category.features.map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {getFeatureIcon(feature)}
                    <span className="ml-1">{feature}</span>
                  </Badge>
                ))}
              </div>

              {/* Pricing Info */}
              {!showPricing && (
                <div className="text-sm text-muted-foreground">
                  Base: ${category.base_fare} + ${category.base_price_per_km}/km • Min: ${category.minimum_fare}
                </div>
              )}

              {/* Car Image Placeholder */}
              {category.image_url && (
                <div className="mt-3">
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-32 object-cover rounded-md"
                  />
                </div>
              )}
            </div>

            {!readonly && (
              <Button
                variant={selectedCategoryId === category.id ? "default" : "outline"}
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategorySelect(category);
                }}
              >
                {selectedCategoryId === category.id ? 'Selected' : 'Select'}
              </Button>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-8">
            <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No car categories available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CarCategorySelector;