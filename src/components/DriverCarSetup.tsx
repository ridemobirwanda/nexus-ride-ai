import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Car, Save, Settings } from 'lucide-react';
import CarMediaUpload from './CarMediaUpload';
import CarCategorySelector from './CarCategorySelector';

interface DriverCarSetupProps {
  driverId: string;
}

interface CarImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

interface CarVideo {
  id: string;
  video_url: string;
  thumbnail_url?: string;
  is_primary: boolean;
}

interface CarCategory {
  id: string;
  name: string;
  description: string;
  base_price_per_km: number;
  base_fare: number;
  minimum_fare: number;
  features: string[];
}

interface DriverData {
  car_model: string;
  car_plate: string;
  car_year: number | null;
  car_color: string | null;
  car_category_id: string | null;
  bio: string | null;
}

const DriverCarSetup = ({ driverId }: DriverCarSetupProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [carImages, setCarImages] = useState<CarImage[]>([]);
  const [carVideos, setCarVideos] = useState<CarVideo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CarCategory | null>(null);
  const [driverData, setDriverData] = useState<DriverData>({
    car_model: '',
    car_plate: '',
    car_year: null,
    car_color: '',
    car_category_id: null,
    bio: ''
  });

  useEffect(() => {
    fetchDriverData();
    fetchCarImages();
    fetchCarVideos();
  }, [driverId]);

  const fetchDriverData = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          car_model,
          car_plate,
          car_year,
          car_color,
          car_category_id,
          bio,
          car_categories (*)
        `)
        .eq('id', driverId)
        .single();

      if (error) throw error;

      setDriverData({
        car_model: data.car_model || '',
        car_plate: data.car_plate || '',
        car_year: data.car_year,
        car_color: data.car_color || '',
        car_category_id: data.car_category_id,
        bio: data.bio || ''
      });

      if (data.car_categories) {
        // Transform the data to match our interface
        const transformedCategory = {
          ...data.car_categories,
          features: Array.isArray(data.car_categories.features) 
            ? data.car_categories.features.map((f: any) => String(f))
            : []
        };
        setSelectedCategory(transformedCategory);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load driver data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCarImages = async () => {
    try {
      const { data, error } = await supabase
        .from('car_images')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCarImages(data || []);
    } catch (error: any) {
      console.error('Error fetching car images:', error);
    }
  };

  const fetchCarVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('car_videos')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCarVideos(data || []);
    } catch (error: any) {
      console.error('Error fetching car videos:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Please select a car category",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          car_model: driverData.car_model,
          car_plate: driverData.car_plate,
          car_year: driverData.car_year,
          car_color: driverData.car_color,
          car_category_id: selectedCategory.id,
          bio: driverData.bio
        })
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Car information updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Car Category Selection */}
      <CarCategorySelector
        selectedCategoryId={selectedCategory?.id}
        onCategorySelect={setSelectedCategory}
      />

      {/* Car Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Vehicle Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="car_model">Car Model *</Label>
              <Input
                id="car_model"
                placeholder="e.g., Toyota Camry"
                value={driverData.car_model}
                onChange={(e) => setDriverData({ ...driverData, car_model: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="car_plate">License Plate *</Label>
              <Input
                id="car_plate"
                placeholder="e.g., ABC-1234"
                value={driverData.car_plate}
                onChange={(e) => setDriverData({ ...driverData, car_plate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="car_year">Year</Label>
              <Input
                id="car_year"
                type="number"
                placeholder="e.g., 2020"
                value={driverData.car_year || ''}
                onChange={(e) => setDriverData({ 
                  ...driverData, 
                  car_year: e.target.value ? parseInt(e.target.value) : null 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="car_color">Color</Label>
              <Input
                id="car_color"
                placeholder="e.g., White"
                value={driverData.car_color || ''}
                onChange={(e) => setDriverData({ ...driverData, car_color: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell passengers a bit about yourself and your service..."
              value={driverData.bio || ''}
              onChange={(e) => setDriverData({ ...driverData, bio: e.target.value })}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSave}
            disabled={isSaving || !driverData.car_model || !driverData.car_plate || !selectedCategory}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Vehicle Info'}
          </Button>
        </CardContent>
      </Card>

      {/* Car Media (Images & Videos) */}
      <CarMediaUpload
        driverId={driverId}
        images={carImages}
        videos={carVideos}
        onImagesUpdate={setCarImages}
        onVideosUpdate={setCarVideos}
      />

      {selectedCategory && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Car className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-medium text-primary mb-2">
                  Selected Category: {selectedCategory.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedCategory.description}
                </p>
                <div className="text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Base Fare: <span className="font-medium">${selectedCategory.base_fare}</span></div>
                    <div>Per KM: <span className="font-medium">${selectedCategory.base_price_per_km}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverCarSetup;