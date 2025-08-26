-- Create earnings tracking table
CREATE TABLE IF NOT EXISTS public.driver_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  ride_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;

-- Create policies for driver earnings
CREATE POLICY "Drivers can view their own earnings" 
ON public.driver_earnings 
FOR SELECT 
USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

-- Create policy for automatic earnings insertion (system use)
CREATE POLICY "System can insert earnings" 
ON public.driver_earnings 
FOR INSERT 
WITH CHECK (true);

-- Create function to automatically record earnings when ride is completed
CREATE OR REPLACE FUNCTION public.record_driver_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only process when ride is completed and has a final fare
  IF NEW.status = 'completed' AND NEW.final_fare IS NOT NULL AND OLD.status != 'completed' THEN
    INSERT INTO public.driver_earnings (driver_id, ride_id, amount, date)
    VALUES (NEW.driver_id, NEW.id, NEW.final_fare, CURRENT_DATE);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically record earnings
DROP TRIGGER IF EXISTS trigger_record_driver_earnings ON public.rides;
CREATE TRIGGER trigger_record_driver_earnings
  AFTER UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.record_driver_earnings();

-- Create function to get driver earnings summary
CREATE OR REPLACE FUNCTION public.get_driver_earnings_summary(p_driver_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  total_earnings NUMERIC,
  total_rides INTEGER,
  avg_fare NUMERIC,
  today_earnings NUMERIC,
  yesterday_earnings NUMERIC,
  this_week_earnings NUMERIC,
  last_week_earnings NUMERIC,
  daily_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_driver_id UUID;
BEGIN
  -- Get driver ID
  SELECT id INTO v_driver_id FROM public.drivers WHERE user_id = p_driver_user_id;
  
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Driver not found for user';
  END IF;
  
  RETURN QUERY
  WITH earnings_data AS (
    SELECT 
      e.amount,
      e.date,
      e.ride_id
    FROM public.driver_earnings e
    WHERE e.driver_id = v_driver_id
    AND e.date >= CURRENT_DATE - INTERVAL '1 day' * p_days
  ),
  daily_stats AS (
    SELECT 
      date,
      SUM(amount) as day_total,
      COUNT(*) as day_rides
    FROM earnings_data
    GROUP BY date
    ORDER BY date DESC
  )
  SELECT 
    COALESCE(SUM(ed.amount), 0) as total_earnings,
    COUNT(ed.ride_id)::INTEGER as total_rides,
    COALESCE(AVG(ed.amount), 0) as avg_fare,
    
    -- Today's earnings
    COALESCE((SELECT SUM(amount) FROM earnings_data WHERE date = CURRENT_DATE), 0) as today_earnings,
    
    -- Yesterday's earnings  
    COALESCE((SELECT SUM(amount) FROM earnings_data WHERE date = CURRENT_DATE - 1), 0) as yesterday_earnings,
    
    -- This week's earnings (last 7 days)
    COALESCE((SELECT SUM(amount) FROM earnings_data WHERE date >= CURRENT_DATE - 6), 0) as this_week_earnings,
    
    -- Last week's earnings (days 7-13 ago)
    COALESCE((SELECT SUM(amount) FROM earnings_data WHERE date >= CURRENT_DATE - 13 AND date <= CURRENT_DATE - 7), 0) as last_week_earnings,
    
    -- Daily breakdown as JSON
    (SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'date', date,
        'earnings', day_total,
        'rides', day_rides
      ) ORDER BY date DESC
    ), '[]'::jsonb) FROM daily_stats) as daily_breakdown
    
  FROM earnings_data ed;
END;
$function$;