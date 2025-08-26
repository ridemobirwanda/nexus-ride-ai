import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Camera, Upload, X, Star } from 'lucide-react';

interface CarImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

interface CarImageUploadProps {
  driverId: string;
  images: CarImage[];
  onImagesUpdate: (images: CarImage[]) => void;
}

const CarImageUpload = ({ driverId, images, onImagesUpdate }: CarImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(uploadImage);
    
    try {
      await Promise.all(uploadPromises);
      await fetchImages();
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const uploadImage = async (file: File) => {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${driverId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('car-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);

    // Save to database
    const { error: dbError } = await supabase
      .from('car_images')
      .insert({
        driver_id: driverId,
        image_url: data.publicUrl,
        is_primary: images.length === 0 // First image is primary
      });

    if (dbError) throw dbError;
  };

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('car_images')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching images:', error);
      return;
    }

    onImagesUpdate(data || []);
  };

  const setPrimaryImage = async (imageId: string) => {
    try {
      // Remove primary flag from all images
      await supabase
        .from('car_images')
        .update({ is_primary: false })
        .eq('driver_id', driverId);

      // Set new primary image
      const { error } = await supabase
        .from('car_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) throw error;

      await fetchImages();
      toast({
        title: "Success",
        description: "Primary image updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteImage = async (imageId: string, imageUrl: string) => {
    try {
      // Extract filename from URL
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        // Delete from storage
        await supabase.storage
          .from('car-images')
          .remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('car_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      await fetchImages();
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Car Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Add Photos'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Upload multiple photos of your car
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Images Grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-muted">
                  <img
                    src={image.image_url}
                    alt="Car"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                
                {/* Primary Badge */}
                {image.is_primary && (
                  <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Primary
                  </Badge>
                )}

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    {!image.is_primary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPrimaryImage(image.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteImage(image.id, image.image_url)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No car photos yet</p>
            <p className="text-sm text-muted-foreground">
              Add photos to help passengers identify your vehicle
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CarImageUpload;