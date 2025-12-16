import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HotspotData {
  latitude: number;
  longitude: number;
  intensity: number;
  rideCount: number;
  predictedDemand: 'low' | 'medium' | 'high' | 'surge';
  timeSlot: string;
  areaName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_TOKEN");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get request parameters
    const { timeRange = '24h', centerLat, centerLng } = await req.json().catch(() => ({}));

    // Calculate time filter
    const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 24;
    const sinceTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    // Fetch historical ride data
    const { data: rides, error: ridesError } = await supabase
      .from('rides')
      .select('pickup_location, dropoff_location, pickup_address, created_at, status')
      .gte('created_at', sinceTime)
      .order('created_at', { ascending: false })
      .limit(500);

    if (ridesError) {
      console.error('Error fetching rides:', ridesError);
      throw ridesError;
    }

    console.log(`Fetched ${rides?.length || 0} rides for analysis`);

    // Extract pickup coordinates and cluster them
    const pickupPoints: Array<{ lat: number; lng: number; address: string; time: string }> = [];
    
    for (const ride of rides || []) {
      if (ride.pickup_location) {
        // Parse point format: (lng,lat) or {x, y}
        let lat: number, lng: number;
        const location = ride.pickup_location as any;
        
        if (typeof location === 'string') {
          const match = location.match(/\(([^,]+),([^)]+)\)/);
          if (match) {
            lng = parseFloat(match[1]);
            lat = parseFloat(match[2]);
          } else continue;
        } else if (location.x !== undefined && location.y !== undefined) {
          lng = location.x;
          lat = location.y;
        } else continue;

        if (!isNaN(lat) && !isNaN(lng)) {
          pickupPoints.push({
            lat,
            lng,
            address: ride.pickup_address || '',
            time: ride.created_at
          });
        }
      }
    }

    console.log(`Extracted ${pickupPoints.length} valid pickup points`);

    // Cluster nearby points (within ~500m)
    const clusters: Map<string, { lat: number; lng: number; count: number; addresses: string[] }> = new Map();
    const gridSize = 0.005; // ~500m at equator

    for (const point of pickupPoints) {
      const gridKey = `${Math.floor(point.lat / gridSize) * gridSize},${Math.floor(point.lng / gridSize) * gridSize}`;
      
      if (clusters.has(gridKey)) {
        const cluster = clusters.get(gridKey)!;
        cluster.count++;
        cluster.lat = (cluster.lat * (cluster.count - 1) + point.lat) / cluster.count;
        cluster.lng = (cluster.lng * (cluster.count - 1) + point.lng) / cluster.count;
        if (point.address && !cluster.addresses.includes(point.address)) {
          cluster.addresses.push(point.address);
        }
      } else {
        clusters.set(gridKey, {
          lat: point.lat,
          lng: point.lng,
          count: 1,
          addresses: point.address ? [point.address] : []
        });
      }
    }

    // Convert clusters to hotspots
    const clusterArray = Array.from(clusters.values());
    const maxCount = Math.max(...clusterArray.map(c => c.count), 1);

    let hotspots: HotspotData[] = clusterArray.map(cluster => {
      const intensity = cluster.count / maxCount;
      let predictedDemand: 'low' | 'medium' | 'high' | 'surge';
      
      if (intensity >= 0.8) predictedDemand = 'surge';
      else if (intensity >= 0.5) predictedDemand = 'high';
      else if (intensity >= 0.25) predictedDemand = 'medium';
      else predictedDemand = 'low';

      return {
        latitude: cluster.lat,
        longitude: cluster.lng,
        intensity,
        rideCount: cluster.count,
        predictedDemand,
        timeSlot: getCurrentTimeSlot(),
        areaName: cluster.addresses[0]?.split(',')[0] || undefined
      };
    });

    // Sort by intensity
    hotspots.sort((a, b) => b.intensity - a.intensity);

    // Use AI for enhanced predictions if we have enough data
    let aiInsights: string | null = null;
    
    if (LOVABLE_API_KEY && hotspots.length >= 3) {
      try {
        const topHotspots = hotspots.slice(0, 10);
        const currentHour = new Date().getHours();
        const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are a ride demand prediction analyst. Analyze ride pickup hotspots and provide brief, actionable insights for drivers. Be concise.`
              },
              {
                role: "user",
                content: `Current time: ${currentHour}:00 on ${dayOfWeek}
                
Top pickup hotspots (last ${hoursAgo}h):
${topHotspots.map((h, i) => `${i + 1}. ${h.areaName || 'Unknown'}: ${h.rideCount} rides (${h.predictedDemand} demand)`).join('\n')}

Provide 2-3 brief tips for drivers about where demand is likely to be highest in the next few hours. Consider time of day and typical patterns.`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiInsights = aiData.choices?.[0]?.message?.content || null;
        }
      } catch (aiError) {
        console.error('AI prediction error:', aiError);
      }
    }

    // Generate mock data if no real data exists
    if (hotspots.length === 0) {
      const defaultCenter = { lat: centerLat || -1.9403, lng: centerLng || 29.8739 }; // Kigali
      hotspots = generateMockHotspots(defaultCenter);
      aiInsights = "Based on typical patterns: Downtown and commercial areas see higher demand during morning (7-9 AM) and evening (5-7 PM) rush hours. Airport pickups increase in late afternoon.";
    }

    console.log(`Returning ${hotspots.length} hotspots with AI insights: ${!!aiInsights}`);

    return new Response(JSON.stringify({
      hotspots,
      totalRides: pickupPoints.length,
      timeRange,
      aiInsights,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Demand prediction error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getCurrentTimeSlot(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return 'morning_rush';
  if (hour >= 10 && hour < 16) return 'midday';
  if (hour >= 16 && hour < 20) return 'evening_rush';
  return 'night';
}

function generateMockHotspots(center: { lat: number; lng: number }): HotspotData[] {
  const hotspots: HotspotData[] = [
    { latitude: center.lat + 0.01, longitude: center.lng + 0.005, intensity: 0.95, rideCount: 45, predictedDemand: 'surge', timeSlot: 'evening_rush', areaName: 'City Center' },
    { latitude: center.lat - 0.008, longitude: center.lng + 0.012, intensity: 0.78, rideCount: 32, predictedDemand: 'high', timeSlot: 'evening_rush', areaName: 'Convention Center' },
    { latitude: center.lat + 0.015, longitude: center.lng - 0.01, intensity: 0.65, rideCount: 28, predictedDemand: 'high', timeSlot: 'evening_rush', areaName: 'Business District' },
    { latitude: center.lat - 0.02, longitude: center.lng - 0.005, intensity: 0.52, rideCount: 22, predictedDemand: 'high', timeSlot: 'evening_rush', areaName: 'Shopping Mall' },
    { latitude: center.lat + 0.005, longitude: center.lng + 0.02, intensity: 0.45, rideCount: 18, predictedDemand: 'medium', timeSlot: 'evening_rush', areaName: 'University Area' },
    { latitude: center.lat - 0.012, longitude: center.lng + 0.008, intensity: 0.38, rideCount: 15, predictedDemand: 'medium', timeSlot: 'evening_rush', areaName: 'Hospital Zone' },
    { latitude: center.lat + 0.018, longitude: center.lng + 0.015, intensity: 0.28, rideCount: 11, predictedDemand: 'medium', timeSlot: 'evening_rush', areaName: 'Residential Area' },
    { latitude: center.lat - 0.025, longitude: center.lng - 0.018, intensity: 0.18, rideCount: 7, predictedDemand: 'low', timeSlot: 'evening_rush', areaName: 'Suburbs' },
  ];
  return hotspots;
}
