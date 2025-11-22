import { createContext, useContext, ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ReducedMotionContextType {
  prefersReducedMotion: boolean;
}

const ReducedMotionContext = createContext<ReducedMotionContextType>({
  prefersReducedMotion: false,
});

export const useReducedMotionContext = () => useContext(ReducedMotionContext);

interface ReducedMotionProviderProps {
  children: ReactNode;
}

/**
 * Provider component that makes reduced motion preference available to all components
 * Automatically detects user's prefers-reduced-motion setting
 */
export const ReducedMotionProvider = ({ children }: ReducedMotionProviderProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ReducedMotionContext.Provider value={{ prefersReducedMotion }}>
      {children}
    </ReducedMotionContext.Provider>
  );
};
