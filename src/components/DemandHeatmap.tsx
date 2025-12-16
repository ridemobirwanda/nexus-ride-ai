import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, MapPin, RefreshCw, Sparkles, Flame, ThermometerSun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface HotspotData {
  latitude: number;
  longitude: number;
  intensity: number;
  rideCount: number;
  predictedDemand: 'low' | 'medium' | 'high' | 'surge';
  timeSlot: string;
  areaName?: string;
}

interface DemandData {
  hotspots: HotspotData[];
  totalRides: number;
  timeRange: string;
  aiInsights: string | null;
  generatedAt: string;
}

interface DemandHeatmapProps {
  className?: string;
  onNavigateToHotspot?: (lat: number, lng: number) => void;
}

const DemandHeatmap = ({ className, onNavigateToHotspot }: DemandHeatmapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [demandData, setDemandData] = useState<DemandData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(true);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-mapbox-token');
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
      }
    };
    fetchToken();
  }, []);

  // Fetch demand data
  const fetchDemandData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('demand-prediction', {
        body: { timeRange }
      });

      if (error) throw error;
      setDemandData(data);
    } catch (err) {
      console.error('Failed to fetch demand data:', err);
      toast({
        title: "Failed to load demand data",
        description: "Using cached data if available",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchDemandData();
  }, [fetchDemandData]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [29.8739, -1.9403], // Kigali
      zoom: 12,
      pitch: 45
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      // Add heatmap source
      map.current?.addSource('demand-heatmap', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Add heatmap layer
      map.current?.addLayer({
        id: 'demand-heat',
        type: 'heatmap',
        source: 'demand-heatmap',
        paint: {
          'heatmap-weight': ['get', 'intensity'],
          'heatmap-intensity': 1.5,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.2, 'rgba(0, 255, 255, 0.5)',
            0.4, 'rgba(0, 255, 0, 0.6)',
            0.6, 'rgba(255, 255, 0, 0.7)',
            0.8, 'rgba(255, 165, 0, 0.8)',
            1, 'rgba(255, 0, 0, 0.9)'
          ],
          'heatmap-radius': 40,
          'heatmap-opacity': 0.8
        }
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Update heatmap data
  useEffect(() => {
    if (!map.current || !demandData?.hotspots.length) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Update heatmap source
    const source = map.current.getSource('demand-heatmap') as mapboxgl.GeoJSONSource;
    if (source) {
      const features = demandData.hotspots.map(h => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [h.longitude, h.latitude]
        },
        properties: {
          intensity: h.intensity,
          rideCount: h.rideCount,
          demand: h.predictedDemand,
          areaName: h.areaName
        }
      }));

      source.setData({
        type: 'FeatureCollection',
        features
      });
    }

    // Add markers for top hotspots
    const topHotspots = demandData.hotspots.slice(0, 5);
    
    topHotspots.forEach((hotspot, index) => {
      const el = document.createElement('div');
      el.className = 'demand-marker';
      el.innerHTML = `
        <div class="relative">
          <div class="absolute -inset-2 rounded-full ${
            hotspot.predictedDemand === 'surge' ? 'bg-red-500' :
            hotspot.predictedDemand === 'high' ? 'bg-orange-500' :
            hotspot.predictedDemand === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
          } opacity-30 animate-ping"></div>
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${
            hotspot.predictedDemand === 'surge' ? 'bg-red-500' :
            hotspot.predictedDemand === 'high' ? 'bg-orange-500' :
            hotspot.predictedDemand === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
          } text-white font-bold text-sm shadow-lg">
            ${index + 1}
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h4 class="font-bold">${hotspot.areaName || 'Hotspot'}</h4>
          <p class="text-sm">${hotspot.rideCount} rides</p>
          <p class="text-xs capitalize font-medium ${
            hotspot.predictedDemand === 'surge' ? 'text-red-600' :
            hotspot.predictedDemand === 'high' ? 'text-orange-600' :
            'text-yellow-600'
          }">${hotspot.predictedDemand} demand</p>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([hotspot.longitude, hotspot.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit map to hotspots
    if (topHotspots.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      topHotspots.forEach(h => bounds.extend([h.longitude, h.latitude]));
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [demandData]);

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'surge': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  const getDemandIcon = (demand: string) => {
    switch (demand) {
      case 'surge': return <Flame className="h-3 w-3" />;
      case 'high': return <TrendingUp className="h-3 w-3" />;
      default: return <ThermometerSun className="h-3 w-3" />;
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Demand Heatmap
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={(v: '24h' | '7d' | '30d') => setTimeRange(v)}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24h</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchDemandData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Map */}
          <div 
            ref={mapContainer} 
            className="w-full h-64 rounded-lg overflow-hidden border"
          />

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Analyzing demand patterns...</span>
            </div>
          )}

          {/* AI Insights */}
          {demandData?.aiInsights && showInsights && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">AI Prediction</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {demandData.aiInsights}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowInsights(false)}
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          {/* Top Hotspots List */}
          {demandData && demandData.hotspots.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Top Pickup Hotspots</h4>
              <div className="space-y-1.5">
                {demandData.hotspots.slice(0, 5).map((hotspot, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      map.current?.flyTo({
                        center: [hotspot.longitude, hotspot.latitude],
                        zoom: 15,
                        pitch: 60
                      });
                      onNavigateToHotspot?.(hotspot.latitude, hotspot.longitude);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getDemandColor(hotspot.predictedDemand)}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{hotspot.areaName || 'Unknown Area'}</p>
                        <p className="text-xs text-muted-foreground">{hotspot.rideCount} rides</p>
                      </div>
                    </div>
                    <Badge className={`gap-1 ${getDemandColor(hotspot.predictedDemand)}`}>
                      {getDemandIcon(hotspot.predictedDemand)}
                      {hotspot.predictedDemand}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Surge</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemandHeatmap;
