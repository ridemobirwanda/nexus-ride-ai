import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Car,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface EarningsData {
  total_earnings: number;
  total_rides: number;
  avg_fare: number;
  today_earnings: number;
  yesterday_earnings: number;
  this_week_earnings: number;
  last_week_earnings: number;
  daily_breakdown: Array<{
    date: string;
    earnings: number;
    rides: number;
  }>;
}

interface EarningsDashboardProps {
  className?: string;
}

const EarningsDashboard: React.FC<EarningsDashboardProps> = ({ className }) => {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30'>('7');

  const fetchEarningsData = async () => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_driver_earnings_summary', {
        p_driver_user_id: user.user.id,
        p_days: parseInt(selectedPeriod)
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const earningsData = {
          ...data[0],
          daily_breakdown: Array.isArray(data[0].daily_breakdown) 
            ? data[0].daily_breakdown 
            : JSON.parse(data[0].daily_breakdown as string) || []
        };
        setEarningsData(earningsData);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => `$${Number(amount).toFixed(2)}`;

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, isPositive: true };
    const percentage = ((current - previous) / previous) * 100;
    return { percentage: Math.abs(percentage), isPositive: percentage >= 0 };
  };

  const todayVsYesterday = earningsData 
    ? calculateTrend(earningsData.today_earnings, earningsData.yesterday_earnings)
    : { percentage: 0, isPositive: true };

  const thisWeekVsLastWeek = earningsData 
    ? calculateTrend(earningsData.this_week_earnings, earningsData.last_week_earnings)
    : { percentage: 0, isPositive: true };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="gradient-card card-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Earnings Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchEarningsData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as '7' | '30')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="7">Last 7 Days</TabsTrigger>
              <TabsTrigger value="30">Last 30 Days</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedPeriod} className="space-y-6 mt-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    Total Earnings
                  </div>
                  <div className="text-2xl font-bold">
                    {earningsData ? formatCurrency(earningsData.total_earnings) : '$0.00'}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Car className="h-4 w-4" />
                    Total Rides
                  </div>
                  <div className="text-2xl font-bold">
                    {earningsData?.total_rides || 0}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Target className="h-4 w-4" />
                    Avg Fare
                  </div>
                  <div className="text-2xl font-bold">
                    {earningsData ? formatCurrency(earningsData.avg_fare) : '$0.00'}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Today
                  </div>
                  <div className="text-2xl font-bold">
                    {earningsData ? formatCurrency(earningsData.today_earnings) : '$0.00'}
                  </div>
                </div>
              </div>

              {/* Trend Comparison */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Today vs Yesterday</p>
                        <p className="text-xl font-bold">
                          {earningsData ? formatCurrency(earningsData.today_earnings) : '$0.00'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {todayVsYesterday.isPositive ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <Badge 
                          variant={todayVsYesterday.isPositive ? "default" : "secondary"}
                          className={todayVsYesterday.isPositive ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"}
                        >
                          {todayVsYesterday.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">This Week vs Last</p>
                        <p className="text-xl font-bold">
                          {earningsData ? formatCurrency(earningsData.this_week_earnings) : '$0.00'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {thisWeekVsLastWeek.isPositive ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <Badge 
                          variant={thisWeekVsLastWeek.isPositive ? "default" : "secondary"}
                          className={thisWeekVsLastWeek.isPositive ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"}
                        >
                          {thisWeekVsLastWeek.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Breakdown */}
              {earningsData?.daily_breakdown && earningsData.daily_breakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5" />
                      Daily Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {earningsData.daily_breakdown.slice(0, 10).map((day, index) => (
                        <div key={day.date} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">
                              {new Date(day.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {day.rides} rides
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(day.earnings)}</div>
                            {day.rides > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(day.earnings / day.rides)} avg
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Data State */}
              {(!earningsData || earningsData.total_rides === 0) && (
                <Card>
                  <CardContent className="text-center py-12">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No earnings data</h3>
                    <p className="text-muted-foreground">
                      Complete your first ride to start tracking earnings
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EarningsDashboard;