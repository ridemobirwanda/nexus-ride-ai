import { useCallback } from 'react';

export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[] = 200) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const vibrateNewRide = useCallback(() => {
    // Pattern: vibrate 300ms, pause 100ms, vibrate 300ms
    vibrate([300, 100, 300]);
  }, [vibrate]);

  const vibrateShort = useCallback(() => {
    vibrate(100);
  }, [vibrate]);

  const vibrateLong = useCallback(() => {
    vibrate(400);
  }, [vibrate]);

  return {
    vibrate,
    vibrateNewRide,
    vibrateShort,
    vibrateLong
  };
};
