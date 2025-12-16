import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get driver profile
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (driverError || !driver) {
      return new Response(JSON.stringify({ error: 'Driver not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch rides for this driver
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: rides, error: ridesError } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', driver.id)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false });

    if (ridesError) throw ridesError;

    // Fetch earnings
    const { data: earnings, error: earningsError } = await supabase
      .from('driver_earnings')
      .select('*')
      .eq('driver_id', driver.id)
      .gte('date', thirtyDaysAgo.split('T')[0])
      .order('date', { ascending: false });

    if (earningsError) throw earningsError;

    // Fetch reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('driver_reviews')
      .select('*')
      .eq('driver_id', driver.id)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false });

    if (reviewsError) throw reviewsError;

    // Calculate analytics
    const completedRides = rides?.filter(r => r.status === 'completed') || [];
    const cancelledRides = rides?.filter(r => r.status === 'cancelled') || [];
    
    // Weekly breakdown
    const weeklyData: Record<string, { rides: number; earnings: number; rating: number; ratingCount: number }> = {};
    const now = new Date();
    
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyData[weekKey] = { rides: 0, earnings: 0, rating: 0, ratingCount: 0 };
    }

    completedRides.forEach(ride => {
      const rideDate = new Date(ride.created_at);
      const weekStart = new Date(rideDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].rides++;
        weeklyData[weekKey].earnings += ride.final_fare || ride.estimated_fare || 0;
      }
    });

    reviews?.forEach(review => {
      const reviewDate = new Date(review.created_at);
      const weekStart = new Date(reviewDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].rating += review.rating;
        weeklyData[weekKey].ratingCount++;
      }
    });

    // Calculate averages
    Object.keys(weeklyData).forEach(key => {
      if (weeklyData[key].ratingCount > 0) {
        weeklyData[key].rating = weeklyData[key].rating / weeklyData[key].ratingCount;
      }
    });

    // Daily breakdown (last 7 days)
    const dailyData: Array<{ date: string; rides: number; earnings: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRides = completedRides.filter(r => r.created_at.startsWith(dateStr));
      const dayEarnings = earnings?.filter(e => e.date === dateStr) || [];
      
      dailyData.push({
        date: dateStr,
        rides: dayRides.length,
        earnings: dayEarnings.reduce((sum, e) => sum + e.amount, 0)
      });
    }

    // Peak hours analysis
    const hourlyRides: Record<number, number> = {};
    completedRides.forEach(ride => {
      const hour = new Date(ride.created_at).getHours();
      hourlyRides[hour] = (hourlyRides[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourlyRides)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Calculate metrics
    const totalEarnings = earnings?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const avgRating = reviews?.length 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : driver.rating || 0;
    const acceptanceRate = rides?.length 
      ? (completedRides.length / rides.length) * 100 
      : 100;
    const cancelRate = rides?.length 
      ? (cancelledRides.length / rides.length) * 100 
      : 0;
    const avgTripDistance = completedRides.length
      ? completedRides.reduce((sum, r) => sum + (r.distance_km || 0), 0) / completedRides.length
      : 0;
    const avgTripFare = completedRides.length
      ? completedRides.reduce((sum, r) => sum + (r.final_fare || r.estimated_fare || 0), 0) / completedRides.length
      : 0;

    const analytics = {
      summary: {
        totalRides: completedRides.length,
        totalEarnings,
        avgRating: Math.round(avgRating * 10) / 10,
        acceptanceRate: Math.round(acceptanceRate),
        cancelRate: Math.round(cancelRate * 10) / 10,
        avgTripDistance: Math.round(avgTripDistance * 10) / 10,
        avgTripFare: Math.round(avgTripFare * 100) / 100,
        totalReviews: reviews?.length || 0
      },
      weeklyBreakdown: Object.entries(weeklyData)
        .map(([week, data]) => ({ week, ...data }))
        .reverse(),
      dailyBreakdown: dailyData,
      peakHours,
      recentReviews: reviews?.slice(0, 5) || []
    };

    // Generate AI tips if available
    let aiTips: string[] = [];
    
    if (LOVABLE_API_KEY) {
      try {
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
                content: "You are a ride-hailing driver performance coach. Give brief, actionable tips based on analytics data. Return exactly 3 tips, each on its own line, no numbering or bullets."
              },
              {
                role: "user",
                content: `Driver stats (last 30 days):
- ${completedRides.length} completed rides
- ${Math.round(avgRating * 10) / 10}/5 rating
- ${Math.round(acceptanceRate)}% acceptance rate
- ${Math.round(cancelRate)}% cancellation rate
- Peak hours: ${peakHours.map(h => `${h}:00`).join(', ')}
- Avg fare: $${Math.round(avgTripFare * 100) / 100}

Give 3 personalized tips to improve earnings and rating.`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          aiTips = content.split('\n').filter((line: string) => line.trim()).slice(0, 3);
        }
      } catch (aiError) {
        console.error('AI tips error:', aiError);
        aiTips = [
          "Focus on driving during peak hours to maximize earnings",
          "Maintain a clean vehicle and friendly attitude for better ratings",
          "Accept more rides to improve your acceptance rate and visibility"
        ];
      }
    } else {
      aiTips = [
        "Focus on driving during peak hours to maximize earnings",
        "Maintain a clean vehicle and friendly attitude for better ratings",
        "Accept more rides to improve your acceptance rate and visibility"
      ];
    }

    console.log('Analytics generated for driver:', driver.id);

    return new Response(JSON.stringify({
      ...analytics,
      aiTips,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Driver analytics error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
