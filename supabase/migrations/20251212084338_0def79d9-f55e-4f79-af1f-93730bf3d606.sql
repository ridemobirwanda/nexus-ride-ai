CREATE OR REPLACE FUNCTION public.find_nearest_driver(p_pickup_location point, p_max_distance_km numeric DEFAULT 10, p_limit integer DEFAULT 5)
 RETURNS TABLE(driver_id uuid, name text, phone text, car_model text, car_plate text, rating numeric, distance_km numeric, estimated_arrival_minutes integer, total_trips integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as driver_id,
    d.name,
    d.phone,
    d.car_model,
    d.car_plate,
    d.rating,
    -- Calculate distance using Earth's radius approximation
    (point_distance(d.current_location, p_pickup_location) * 111.32) as distance_km,
    -- Estimate arrival time: distance/average_speed(30kmh) * 60min
    ROUND((point_distance(d.current_location, p_pickup_location) * 111.32 / 30) * 60)::integer as estimated_arrival_minutes,
    d.total_trips
  FROM public.drivers d
  WHERE d.status = 'available'
  AND d.current_location IS NOT NULL
  AND d.last_activity_at > (now() - INTERVAL '5 minutes')
  AND (point_distance(d.current_location, p_pickup_location) * 111.32) <= p_max_distance_km
  ORDER BY 
    -- Priority: rating first, then distance
    d.rating DESC,
    (point_distance(d.current_location, p_pickup_location)) ASC
  LIMIT p_limit;
END;
$function$;