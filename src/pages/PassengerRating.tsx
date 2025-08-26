import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Star, ArrowLeft, CheckCircle } from 'lucide-react';

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  final_fare: number;
  distance_km: number;
  duration_minutes: number;
  rating?: number;
  feedback?: string;
  driver?: {
    id: string;
    name: string;
    car_model: string;
    car_plate: string;
  };
}

const PassengerRating = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState<Ride | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRideDetails();
  }, [rideId]);

  const fetchRideDetails = async () => {
    if (!rideId) return;

    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:drivers(*)
        `)
        .eq('id', rideId)
        .single();

      if (error) throw error;
      setRide(data);
      
      // If already rated, populate the form
      if (data.rating) {
        setRating(data.rating);
        setFeedback(data.feedback || '');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitRating = async () => {
    if (!rideId || rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('rides')
        .update({
          rating,
          feedback: feedback.trim() || null
        })
        .eq('id', rideId);

      if (error) throw error;

      toast({
        title: "Thank You!",
        description: "Your rating has been submitted successfully",
      });

      navigate('/passenger/history');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ride Not Found</h2>
          <Button onClick={() => navigate('/passenger/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/passenger/history')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Rate Your Ride</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-md space-y-6">
        {/* Ride Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Ride Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">${ride.final_fare}</p>
              <p className="text-sm text-muted-foreground">
                {ride.distance_km}km • {formatDuration(ride.duration_minutes)}
              </p>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">From</p>
                <p className="text-sm text-muted-foreground">{ride.pickup_address}</p>
              </div>
              <div>
                <p className="text-sm font-medium">To</p>
                <p className="text-sm text-muted-foreground">{ride.dropoff_address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Info */}
        {ride.driver && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>{ride.driver.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{ride.driver.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ride.driver.car_model} • {ride.driver.car_plate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rating */}
        <Card>
          <CardHeader>
            <CardTitle>How was your ride?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="p-1"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredStar || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            {rating > 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {rating === 1 && "We're sorry your ride didn't meet expectations"}
                  {rating === 2 && "There's room for improvement"}
                  {rating === 3 && "Your ride was okay"}
                  {rating === 4 && "Your ride was good"}
                  {rating === 5 && "Excellent ride!"}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Additional feedback (optional)
              </label>
              <Textarea
                placeholder="Tell us about your experience..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={submitRating}
              disabled={rating === 0 || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PassengerRating;