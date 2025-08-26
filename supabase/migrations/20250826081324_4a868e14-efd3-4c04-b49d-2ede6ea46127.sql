-- Add driver photo URL and rating display to drivers table
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add notification preferences to passengers table
ALTER TABLE public.passengers 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"ride_updates": true, "promotional": false}';

-- Create driver reviews table for detailed reviews
CREATE TABLE IF NOT EXISTS public.driver_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  passenger_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_categories JSONB, -- For specific categories like cleanliness, punctuality, etc.
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on driver_reviews
ALTER TABLE public.driver_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for driver_reviews
CREATE POLICY "Passengers can create reviews for their rides"
ON public.driver_reviews
FOR INSERT
WITH CHECK (
  passenger_id IN (
    SELECT id FROM public.passengers 
    WHERE user_id = auth.uid()
  )
  AND ride_id IN (
    SELECT id FROM public.rides 
    WHERE passenger_id = passenger_id AND status = 'completed'
  )
);

CREATE POLICY "Passengers can view their own reviews"
ON public.driver_reviews
FOR SELECT
USING (
  passenger_id IN (
    SELECT id FROM public.passengers 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can view reviews about them"
ON public.driver_reviews
FOR SELECT
USING (
  driver_id IN (
    SELECT id FROM public.drivers 
    WHERE user_id = auth.uid()
  )
);

-- Update updated_at trigger for driver_reviews
CREATE TRIGGER update_driver_reviews_updated_at
  BEFORE UPDATE ON public.driver_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_driver_reviews_driver_id ON public.driver_reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_ride_id ON public.driver_reviews(ride_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_passenger_id ON public.driver_reviews(passenger_id);