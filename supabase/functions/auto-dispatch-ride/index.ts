import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DriverMatch {
  driver_id: string;
  name: string;
  rating: number;
  distance_km: number;
  estimated_arrival_minutes: number;
  total_trips: number;
  match_score: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { ride_id } = await req.json();

    if (!ride_id) {
      return new Response(
        JSON.stringify({ error: 'ride_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Auto-dispatch starting for ride: ${ride_id}`);

    // Get ride details
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*, pickup_location')
      .eq('id', ride_id)
      .single();

    if (rideError || !ride) {
      console.error('Error fetching ride:', rideError);
      return new Response(
        JSON.stringify({ error: 'Ride not found', details: rideError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if ride is still pending
    if (ride.status !== 'pending') {
      return new Response(
        JSON.stringify({ message: 'Ride is not pending', status: ride.status }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get system settings for auto-dispatch configuration
    const { data: settings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['auto_dispatch', 'driver_matching_radius', 'min_driver_rating']);

    const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || []);
    const autoDispatchEnabled = settingsMap.get('auto_dispatch') !== false;
    const matchingRadius = Number(settingsMap.get('driver_matching_radius') || 10);
    const minRating = Number(settingsMap.get('min_driver_rating') || 3.5);

    if (!autoDispatchEnabled) {
      console.log('Auto-dispatch is disabled in system settings');
      return new Response(
        JSON.stringify({ message: 'Auto-dispatch is disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract coordinates from PostGIS point
    const locationMatch = ride.pickup_location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!locationMatch) {
      throw new Error('Invalid pickup location format');
    }
    const [lng, lat] = locationMatch.slice(1).map(Number);

    console.log(`Finding drivers near (${lat}, ${lng}) within ${matchingRadius}km, min rating ${minRating}`);

    // Find nearby drivers using the smart matching function
    const { data: matchedDrivers, error: matchError } = await supabase.rpc(
      'find_nearest_driver',
      {
        p_pickup_location: ride.pickup_location,
        p_max_distance_km: matchingRadius,
        p_limit: 10
      }
    );

    if (matchError) {
      console.error('Error finding drivers:', matchError);
      return new Response(
        JSON.stringify({ error: 'Failed to find drivers', details: matchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter drivers by minimum rating and calculate AI-powered match scores
    const eligibleDrivers = (matchedDrivers || [])
      .filter(d => d.rating >= minRating)
      .map(driver => {
        let score = 0;
        
        // Rating score (40% weight) - higher is better
        score += (driver.rating / 5.0) * 40;
        
        // Distance score (35% weight) - closer is better
        const maxDistance = Math.max(...matchedDrivers.map(d => d.distance_km), 1);
        score += ((maxDistance - driver.distance_km) / maxDistance) * 35;
        
        // Experience score (15% weight) - more trips is better
        const maxTrips = Math.max(...matchedDrivers.map(d => d.total_trips), 1);
        score += (driver.total_trips / maxTrips) * 15;
        
        // ETA score (10% weight) - faster arrival is better
        const maxETA = Math.max(...matchedDrivers.map(d => d.estimated_arrival_minutes), 1);
        score += ((maxETA - driver.estimated_arrival_minutes) / maxETA) * 10;

        return {
          ...driver,
          match_score: Math.round(score * 100) / 100
        };
      })
      .sort((a, b) => b.match_score - a.match_score);

    if (eligibleDrivers.length === 0) {
      console.log('No eligible drivers found');
      return new Response(
        JSON.stringify({ 
          message: 'No drivers available',
          radius: matchingRadius,
          min_rating: minRating
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select the best matching driver
    const bestDriver = eligibleDrivers[0];
    console.log(`Best match: ${bestDriver.name} (Score: ${bestDriver.match_score}, Rating: ${bestDriver.rating}, Distance: ${bestDriver.distance_km.toFixed(2)}km)`);

    // Assign the driver to the ride
    const { error: updateError } = await supabase
      .from('rides')
      .update({
        driver_id: bestDriver.driver_id,
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', ride_id)
      .eq('status', 'pending'); // Only update if still pending

    if (updateError) {
      console.error('Error assigning driver:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to assign driver', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the successful dispatch
    console.log(`Successfully dispatched ride ${ride_id} to driver ${bestDriver.driver_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        ride_id,
        driver: {
          id: bestDriver.driver_id,
          name: bestDriver.name,
          rating: bestDriver.rating,
          distance_km: bestDriver.distance_km,
          eta_minutes: bestDriver.estimated_arrival_minutes,
          match_score: bestDriver.match_score
        },
        total_candidates: eligibleDrivers.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto-dispatch error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Auto-dispatch failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
