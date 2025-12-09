import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DriverMatch {
  driver_id: string;
  name: string;
  phone: string;
  car_model: string;
  car_plate: string;
  rating: number;
  distance_km: number;
  estimated_arrival_minutes: number;
  total_trips: number;
}

interface RideRequest {
  pickup_lat: number;
  pickup_lng: number;
  max_distance_km?: number;
  max_drivers?: number;
  preferred_driver_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Smart driver matching request received');

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { pickup_lat, pickup_lng, max_distance_km = 10, max_drivers = 5, preferred_driver_id }: RideRequest = await req.json();

    if (!pickup_lat || !pickup_lng) {
      return new Response(
        JSON.stringify({ error: 'Pickup coordinates are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Finding drivers near (${pickup_lat}, ${pickup_lng}) within ${max_distance_km}km`);
    if (preferred_driver_id) {
      console.log(`Preferred driver ID: ${preferred_driver_id} - will be prioritized if available`);
    }

    // Create point string in PostgreSQL point format (lng, lat) - NOT WKT POINT format
    const pickupPoint = `(${pickup_lng}, ${pickup_lat})`;

    // Use the smart matching function
    const { data: matchedDrivers, error } = await supabase.rpc(
      'find_nearest_driver',
      {
        p_pickup_location: pickupPoint,
        p_max_distance_km: max_distance_km,
        p_limit: max_drivers
      }
    );

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to find drivers', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const drivers: DriverMatch[] = matchedDrivers || [];

    console.log(`Found ${drivers.length} available drivers`);

    // Log driver details for debugging
    drivers.forEach((driver, index) => {
      console.log(`Driver ${index + 1}: ${driver.name} - Rating: ${driver.rating}, Distance: ${driver.distance_km.toFixed(2)}km, ETA: ${driver.estimated_arrival_minutes}min`);
    });

    // Enhanced matching logic with additional scoring
    const scoredDrivers = drivers.map(driver => {
      let score = 0;
      
      // Check if this is the preferred driver
      const isPreferred = preferred_driver_id && driver.driver_id === preferred_driver_id;
      
      // Rating score (40% weight) - higher is better
      score += (driver.rating / 5.0) * 40;
      
      // Distance score (35% weight) - closer is better
      const maxDistance = Math.max(...drivers.map(d => d.distance_km), 1);
      score += ((maxDistance - driver.distance_km) / maxDistance) * 35;
      
      // Experience score (15% weight) - more trips is better
      const maxTrips = Math.max(...drivers.map(d => d.total_trips), 1);
      score += (driver.total_trips / maxTrips) * 15;
      
      // ETA score (10% weight) - faster arrival is better
      const maxETA = Math.max(...drivers.map(d => d.estimated_arrival_minutes), 1);
      score += ((maxETA - driver.estimated_arrival_minutes) / maxETA) * 10;

      // Preferred driver bonus (add 100 points to ensure they're ranked first)
      if (isPreferred) {
        score += 100;
      }

      return {
        ...driver,
        match_score: Math.round(score * 100) / 100,
        is_preferred: isPreferred
      };
    });

    // Sort by match score (highest first)
    scoredDrivers.sort((a, b) => b.match_score - a.match_score);

    // Log if preferred driver was found and ranked
    if (preferred_driver_id) {
      const preferredDriver = scoredDrivers.find(d => d.driver_id === preferred_driver_id);
      if (preferredDriver) {
        console.log(`✅ Preferred driver found: ${preferredDriver.name} (ranked #${scoredDrivers.indexOf(preferredDriver) + 1})`);
      } else {
        console.log(`⚠️ Preferred driver ${preferred_driver_id} not available in search area`);
      }
    }

    const response = {
      success: true,
      drivers: scoredDrivers,
      total_found: scoredDrivers.length,
      search_params: {
        pickup_location: [pickup_lat, pickup_lng],
        max_distance_km,
        max_drivers
      },
      matching_algorithm: {
        weights: {
          rating: '40%',
          distance: '35%', 
          experience: '15%',
          eta: '10%'
        },
        description: 'Prioritizes high-rated drivers who are close and have good experience'
      }
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Smart matching error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});