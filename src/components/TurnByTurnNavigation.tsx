import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Navigation, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Volume2, 
  VolumeX,
  MapPin,
  Clock,
  Loader2
} from 'lucide-react';
import { useRouteNavigation } from '@/hooks/useRouteNavigation';
import { cn } from '@/lib/utils';

interface TurnByTurnNavigationProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  destinationName?: string;
  onRouteUpdate?: (coordinates: [number, number][]) => void;
  onClose?: () => void;
  className?: string;
  compact?: boolean;
}

const TurnByTurnNavigation = ({
  origin,
  destination,
  destinationName,
  onRouteUpdate,
  onClose,
  className,
  compact = false
}: TurnByTurnNavigationProps) => {
  const {
    route,
    isLoading,
    error,
    currentStep,
    currentStepIndex,
    totalSteps,
    fetchRoute,
    nextStep,
    prevStep,
    formatDistance,
    formatDuration,
    getManeuverIcon
  } = useRouteNavigation();

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fetch route on mount
  useEffect(() => {
    fetchRoute(origin, destination);
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  // Update parent with route coordinates
  useEffect(() => {
    if (route?.coordinates) {
      onRouteUpdate?.(route.coordinates);
    }
  }, [route, onRouteUpdate]);

  // Voice navigation
  useEffect(() => {
    if (!voiceEnabled || !currentStep?.instruction) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(currentStep.instruction);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechRef.current = utterance;
      
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentStep, voiceEnabled]);

  const toggleVoice = () => {
    if (voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Calculating route...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="py-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => fetchRoute(origin, destination)}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!route) return null;

  if (compact) {
    return (
      <div className={cn("bg-card border rounded-lg p-3 shadow-lg", className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getManeuverIcon(currentStep?.maneuver.type || '', currentStep?.maneuver.modifier)}</span>
            <div>
              <p className="font-medium text-sm line-clamp-1">{currentStep?.instruction}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistance(currentStep?.distance || 0)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleVoice}>
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-1" />
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Navigation className="h-5 w-5 text-primary" />
            Navigation
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleVoice}>
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route Summary */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{destinationName || 'Destination'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{formatDistance(route.distance)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(route.duration)}
            </span>
          </div>
        </div>

        {/* Current Step */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-4xl">
              {getManeuverIcon(currentStep?.maneuver.type || '', currentStep?.maneuver.modifier)}
            </div>
            <div className="flex-1">
              <p className="font-medium">{currentStep?.instruction}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDistance(currentStep?.distance || 0)} • {formatDuration(currentStep?.duration || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <Badge variant="secondary">
            Step {currentStepIndex + 1} of {totalSteps}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextStep}
            disabled={currentStepIndex >= totalSteps - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-2" />

        {/* Upcoming Steps Preview */}
        {route.steps.length > currentStepIndex + 1 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Next steps:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {route.steps.slice(currentStepIndex + 1, currentStepIndex + 4).map((step, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 text-xs text-muted-foreground p-1.5 rounded hover:bg-muted/50"
                >
                  <span>{getManeuverIcon(step.maneuver.type, step.maneuver.modifier)}</span>
                  <span className="flex-1 truncate">{step.instruction}</span>
                  <span>{formatDistance(step.distance)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TurnByTurnNavigation;
