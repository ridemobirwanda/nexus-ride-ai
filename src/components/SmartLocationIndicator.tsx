import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartLocationIndicatorProps {
  isCorrecing: boolean;
  confidence?: number;
  corrections?: string[];
  onCorrect?: () => void;
  snappedToRoad?: boolean;
  className?: string;
}

const SmartLocationIndicator = ({
  isCorrecing,
  confidence,
  corrections = [],
  onCorrect,
  snappedToRoad,
  className
}: SmartLocationIndicatorProps) => {
  const [expanded, setExpanded] = useState(false);

  if (isCorrecing) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Optimizing location with AI...</span>
      </div>
    );
  }

  if (!confidence) {
    return onCorrect ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={onCorrect}
        className={cn("text-xs gap-1", className)}
      >
        <Sparkles className="h-3 w-3" />
        Smart Correct Location
      </Button>
    ) : null;
  }

  const getConfidenceColor = () => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getConfidenceIcon = () => {
    if (confidence >= 80) return <CheckCircle2 className="h-3 w-3" />;
    if (confidence >= 60) return <MapPin className="h-3 w-3" />;
    return <AlertTriangle className="h-3 w-3" />;
  };

  return (
    <div className={cn("space-y-1", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
      >
        <Badge variant="secondary" className={cn("gap-1", getConfidenceColor(), "text-white")}>
          {getConfidenceIcon()}
          {confidence}% confidence
        </Badge>
        {snappedToRoad && (
          <Badge variant="outline" className="text-xs">
            Road-snapped
          </Badge>
        )}
      </button>

      {expanded && corrections.length > 0 && (
        <div className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/20">
          <p className="font-medium mb-1">AI Corrections:</p>
          <ul className="space-y-0.5">
            {corrections.map((correction, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-primary">•</span>
                {correction}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SmartLocationIndicator;
