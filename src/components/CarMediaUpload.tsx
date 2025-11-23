import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Camera, Upload, X, Star, Video as VideoIcon, Image as ImageIcon, Play } from 'lucide-react';

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

interface CarMediaUploadProps {
  driverId: string;
  images: CarImage[];
  videos: CarVideo[];
  onImagesUpdate: (images: CarImage[]) => void;
  onVideosUpdate: (videos: CarVideo[]) => void;
}

const CarMediaUpload = ({ 
  driverId, 
  images, 
  videos,
  onImagesUpdate,
  onVideosUpdate 
}: CarMediaUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Image handling
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(uploadImage);
    
    try {
      await Promise.all(uploadPromises);
      await fetchImages();
      toast({
        title: "Success",
        description: `${files.length} image(s) uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${driverId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('car-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('car-images')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('car_images')
      .insert({
        driver_id: driverId,
        image_url: data.publicUrl,
        is_primary: images.length === 0
      });

    if (dbError) throw dbError;
  };

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('car_images')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      onImagesUpdate(data);
    }
  };

  const setPrimaryImage = async (imageId: string) => {
    try {
      await supabase
        .from('car_images')
        .update({ is_primary: false })
        .eq('driver_id', driverId);

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
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        const pathParts = imageUrl.split('car-images/');
        const fullPath = pathParts[1];
        
        await supabase.storage
          .from('car-images')
          .remove([fullPath]);
      }

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

  // Video handling
  const handleVideoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file size (50MB max)
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 50MB limit`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(uploadVideo);
    
    try {
      await Promise.all(uploadPromises);
      await fetchVideos();
      toast({
        title: "Success",
        description: `${files.length} video(s) uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const uploadVideo = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${driverId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('car-videos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('car-videos')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('car_videos')
      .insert({
        driver_id: driverId,
        video_url: data.publicUrl,
        is_primary: videos.length === 0
      });

    if (dbError) throw dbError;
  };

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('car_videos')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      onVideosUpdate(data);
    }
  };

  const setPrimaryVideo = async (videoId: string) => {
    try {
      await supabase
        .from('car_videos')
        .update({ is_primary: false })
        .eq('driver_id', driverId);

      const { error } = await supabase
        .from('car_videos')
        .update({ is_primary: true })
        .eq('id', videoId);

      if (error) throw error;

      await fetchVideos();
      toast({
        title: "Success",
        description: "Primary video updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteVideo = async (videoId: string, videoUrl: string) => {
    try {
      const pathParts = videoUrl.split('car-videos/');
      if (pathParts[1]) {
        await supabase.storage
          .from('car-videos')
          .remove([pathParts[1]]);
      }

      const { error } = await supabase
        .from('car_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      await fetchVideos();
      toast({
        title: "Success",
        description: "Video deleted successfully",
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
          Car Photos & Videos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Photos ({images.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <VideoIcon className="h-4 w-4" />
              Videos ({videos.length})
            </TabsTrigger>
          </TabsList>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => imageInputRef.current?.click()}
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
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-muted hover:border-primary transition-colors">
                      <img
                        src={image.image_url}
                        alt="Car"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    
                    {image.is_primary && (
                      <Badge className="absolute top-2 left-2 bg-primary">
                        <Star className="h-3 w-3 mr-1" />
                        Primary
                      </Badge>
                    )}

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        {!image.is_primary && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPrimaryImage(image.id)}
                            className="h-7 w-7 p-0"
                            title="Set as primary"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteImage(image.id, image.image_url)}
                          className="h-7 w-7 p-0"
                          title="Delete"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No car photos yet</p>
                <p className="text-sm text-muted-foreground">
                  Add photos to help passengers identify your vehicle
                </p>
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => videoInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Add Videos'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Max 50MB per video (MP4, WebM)
              </p>
            </div>

            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              multiple
              onChange={handleVideoSelect}
              className="hidden"
            />

            {videos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="relative group">
                    <div className="aspect-video rounded-lg overflow-hidden border-2 border-muted hover:border-primary transition-colors bg-black">
                      <video
                        src={video.video_url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    </div>
                    
                    {video.is_primary && (
                      <Badge className="absolute top-2 left-2 bg-primary">
                        <Star className="h-3 w-3 mr-1" />
                        Primary
                      </Badge>
                    )}

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        {!video.is_primary && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPrimaryVideo(video.id)}
                            className="h-7 w-7 p-0"
                            title="Set as primary"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteVideo(video.id, video.video_url)}
                          className="h-7 w-7 p-0"
                          title="Delete"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:bg-black/20 transition-colors">
                      <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <VideoIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No car videos yet</p>
                <p className="text-sm text-muted-foreground">
                  Add videos to showcase your vehicle interior and features
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CarMediaUpload;