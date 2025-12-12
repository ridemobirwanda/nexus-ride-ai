import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationInput {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

interface CorrectedLocation {
  latitude: number;
  longitude: number;
  address: string;
  correctedAddress: string;
  confidence: number;
  corrections: string[];
  snappedToRoad: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, context } = await req.json() as { 
      location: LocationInput; 
      context?: string;
    };

    if (!location?.latitude || !location?.longitude) {
      return new Response(
        JSON.stringify({ error: 'Invalid location data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_TOKEN");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Step 1: Get nearby POIs and road data from Mapbox
    let nearbyPlaces: any[] = [];
    let snappedLocation: { latitude: number; longitude: number } | null = null;

    if (MAPBOX_TOKEN) {
      // Reverse geocode to get address info
      const geocodeResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.longitude},${location.latitude}.json?access_token=${MAPBOX_TOKEN}&types=address,poi&limit=5`
      );
      
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        nearbyPlaces = geocodeData.features || [];
      }

      // Snap to nearest road using Map Matching API
      const matchResponse = await fetch(
        `https://api.mapbox.com/matching/v5/mapbox/driving/${location.longitude},${location.latitude}?access_token=${MAPBOX_TOKEN}&geometries=geojson`
      );

      if (matchResponse.ok) {
        const matchData = await matchResponse.json();
        if (matchData.matchings?.[0]?.geometry?.coordinates?.[0]) {
          const [lng, lat] = matchData.matchings[0].geometry.coordinates[0];
          snappedLocation = { latitude: lat, longitude: lng };
        }
      }
    }

    // Step 2: Use AI to analyze and correct the location
    const systemPrompt = `You are a smart location correction assistant for a ride-hailing app in Rwanda.
Your job is to analyze GPS coordinates and suggest corrections when needed.

Given:
- Original coordinates
- User-provided address (if any)
- Nearby POIs and addresses
- GPS accuracy level

You should:
1. Identify if the GPS pin might be inaccurate (common in urban areas, near tall buildings, or poor signal)
2. Suggest the most likely correct location based on context
3. Provide a confidence score (0-100)
4. List any corrections made

Common issues to detect:
- Pin placed in the middle of a road intersection instead of a specific building
- Pin in an inaccessible area (river, building interior)
- GPS drift causing offset from actual location
- Misspelled or ambiguous addresses

Always return valid JSON with the corrected location.`;

    const userPrompt = `Analyze this location and suggest corrections:

Original Coordinates: ${location.latitude}, ${location.longitude}
User Address: ${location.address || 'Not provided'}
GPS Accuracy: ${location.accuracy ? `${location.accuracy} meters` : 'Unknown'}
Context: ${context || 'Ride pickup/dropoff'}

Nearby Places:
${nearbyPlaces.map((p: any) => `- ${p.place_name} (${p.center?.join(', ')})`).join('\n') || 'No nearby places found'}

${snappedLocation ? `Road-snapped coordinates: ${snappedLocation.latitude}, ${snappedLocation.longitude}` : ''}

Return a JSON object with:
{
  "correctedLatitude": number,
  "correctedLongitude": number,
  "correctedAddress": string,
  "confidence": number (0-100),
  "corrections": string[] (list of corrections made),
  "reasoning": string (brief explanation),
  "shouldSnap": boolean (whether to use road-snapped location)
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      // Fallback to basic correction
      return new Response(JSON.stringify({
        original: location,
        corrected: {
          latitude: snappedLocation?.latitude || location.latitude,
          longitude: snappedLocation?.longitude || location.longitude,
          address: nearbyPlaces[0]?.place_name || location.address || 'Unknown location',
          correctedAddress: nearbyPlaces[0]?.place_name || location.address || 'Unknown location',
          confidence: snappedLocation ? 70 : 50,
          corrections: snappedLocation ? ['Snapped to nearest road'] : [],
          snappedToRoad: !!snappedLocation
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    // Parse AI response
    let aiResult;
    try {
      // Extract JSON from response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      aiResult = {
        correctedLatitude: snappedLocation?.latitude || location.latitude,
        correctedLongitude: snappedLocation?.longitude || location.longitude,
        correctedAddress: nearbyPlaces[0]?.place_name || location.address || 'Unknown',
        confidence: 60,
        corrections: [],
        shouldSnap: !!snappedLocation
      };
    }

    // Determine final coordinates
    const finalLat = aiResult.shouldSnap && snappedLocation 
      ? snappedLocation.latitude 
      : aiResult.correctedLatitude || location.latitude;
    const finalLng = aiResult.shouldSnap && snappedLocation 
      ? snappedLocation.longitude 
      : aiResult.correctedLongitude || location.longitude;

    const result: CorrectedLocation = {
      latitude: finalLat,
      longitude: finalLng,
      address: location.address || nearbyPlaces[0]?.place_name || 'Unknown',
      correctedAddress: aiResult.correctedAddress || nearbyPlaces[0]?.place_name || 'Unknown',
      confidence: aiResult.confidence || 50,
      corrections: aiResult.corrections || [],
      snappedToRoad: !!snappedLocation && aiResult.shouldSnap
    };

    console.log('Location correction result:', {
      original: location,
      corrected: result,
      reasoning: aiResult.reasoning
    });

    return new Response(JSON.stringify({
      original: location,
      corrected: result,
      nearbyPlaces: nearbyPlaces.slice(0, 3).map((p: any) => ({
        name: p.place_name,
        coordinates: p.center
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Smart location correction error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
