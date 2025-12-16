import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Star,
  Car,
  DollarSign,
  Clock,
  Target,
  Lightbulb,
  RefreshCw,
  Loader2,
  Calendar,
  BarChart3,
  Award
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  summary: {
    totalRides: number;
    totalEarnings: number;
    avgRating: number;
    acceptanceRate: number;
    cancelRate: number;
    avgTripDistance: number;
    avgTripFare: number;
    totalReviews: number;
  };
  weeklyBreakdown: Array<{
    week: string;
    rides: number;
    earnings: number;
    rating: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    rides: number;
    earnings: number;
  }>;
  peakHours: number[];
  recentReviews: Array<{
    rating: number;
    review_text: string;
    created_at: string;
  }>;
  aiTips: string[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

const DriverAnalytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/driver/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('driver-analytics', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      toast({
        title: "Failed to load analytics",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getPerformanceLevel = (rating: number): { label: string; color: string } => {
    if (rating >= 4.8) return { label: 'Excellent', color: 'bg-green-500' };
    if (rating >= 4.5) return { label: 'Great', color: 'bg-blue-500' };
    if (rating >= 4.0) return { label: 'Good', color: 'bg-yellow-500' };
    return { label: 'Needs Improvement', color: 'bg-orange-500' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load analytics</p>
          <Button onClick={fetchAnalytics} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  const performance = getPerformanceLevel(analytics.summary.avgRating);
  const pieData = [
    { name: 'Completed', value: analytics.summary.acceptanceRate },
    { name: 'Cancelled', value: analytics.summary.cancelRate },
    { name: 'Other', value: Math.max(0, 100 - analytics.summary.acceptanceRate - analytics.summary.cancelRate) }
  ];

  return (
    <div className="min-h-screen rider-bg pb-8">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b px-4 py-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/driver/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Performance Analytics</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Performance Badge */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Performance</p>
                <div className="flex items-center gap-3 mt-1">
                  <Badge className={`${performance.color} text-white text-lg px-3 py-1`}>
                    {performance.label}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold">{analytics.summary.avgRating}</span>
                  </div>
                </div>
              </div>
              <Award className="h-16 w-16 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Car className="h-4 w-4" />
                Total Rides
              </div>
              <p className="text-2xl font-bold mt-1">{analytics.summary.totalRides}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <DollarSign className="h-4 w-4" />
                Earnings
              </div>
              <p className="text-2xl font-bold mt-1">${analytics.summary.totalEarnings.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Target className="h-4 w-4" />
                Acceptance
              </div>
              <p className="text-2xl font-bold mt-1">{analytics.summary.acceptanceRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <BarChart3 className="h-4 w-4" />
                Avg Fare
              </div>
              <p className="text-2xl font-bold mt-1">${analytics.summary.avgTripFare.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Tips */}
        {analytics.aiTips.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Personalized Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.aiTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Daily Rides Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Daily Activity (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.dailyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={(d) => formatDate(d)}
                        formatter={(value: number, name: string) => [
                          name === 'rides' ? `${value} rides` : `$${value.toFixed(2)}`,
                          name === 'rides' ? 'Rides' : 'Earnings'
                        ]}
                      />
                      <Bar dataKey="rides" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Your Peak Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analytics.peakHours.map((hour, i) => (
                    <Badge 
                      key={hour} 
                      variant={i === 0 ? "default" : "secondary"}
                      className="text-sm py-1 px-3"
                    >
                      {hour}:00 - {hour + 1}:00
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Focus on these hours to maximize your earnings
                </p>
              </CardContent>
            </Card>

            {/* Acceptance Rate Pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ride Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Cancelled</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-4 mt-4">
            {/* Earnings Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Earnings Trend (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.dailyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                      <Tooltip 
                        labelFormatter={(d) => formatDate(d)}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="earnings" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Weekly Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.weeklyBreakdown.map((week, i) => (
                  <div key={week.week} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Week {analytics.weeklyBreakdown.length - i}</p>
                      <p className="text-xs text-muted-foreground">{week.rides} rides</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${week.earnings.toFixed(2)}</p>
                      {week.rating > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {week.rating.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 mt-4">
            {/* Rating Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Your Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-6 w-6 ${
                            star <= Math.round(analytics.summary.avgRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-3xl font-bold mt-2">{analytics.summary.avgRating}</p>
                    <p className="text-sm text-muted-foreground">{analytics.summary.totalReviews} reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.recentReviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No reviews yet</p>
                ) : (
                  analytics.recentReviews.map((review, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      {review.review_text && (
                        <p className="text-sm">{review.review_text}</p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DriverAnalytics;
