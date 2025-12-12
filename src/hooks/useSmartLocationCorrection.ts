import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Location {
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

interface CorrectionResult {
  original: Location;
  corrected: CorrectedLocation;
  nearbyPlaces?: Array<{ name: string; coordinates: [number, number] }>;
}

export const useSmartLocationCorrection = () => {
  const [isCorrecing, setIsCorrecting] = useState(false);
  const [lastCorrection, setLastCorrection] = useState<CorrectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const correctLocation = useCallback(async (
    location: Location,
    context?: string
  ): Promise<CorrectedLocation | null> => {
    setIsCorrecting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-location-correction', {
        body: { location, context }
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setLastCorrection(data);

      // Show toast if corrections were made
      if (data.corrected.corrections.length > 0) {
        toast({
          title: "📍 Location Optimized",
          description: data.corrected.corrections.join(', '),
        });
      }

      return data.corrected;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to correct location';
      setError(message);
      console.error('Location correction error:', err);
      return null;
    } finally {
      setIsCorrecting(false);
    }
  }, []);

  const shouldCorrect = useCallback((accuracy?: number): boolean => {
    // Suggest correction if GPS accuracy is poor (>50 meters)
    if (accuracy && accuracy > 50) return true;
    // Always offer correction option
    return true;
  }, []);

  return {
    correctLocation,
    isCorrecing,
    lastCorrection,
    error,
    shouldCorrect
  };
};
