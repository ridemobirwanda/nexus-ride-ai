import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Car,
  Clock,
  Target,
  Wallet
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
  Cell,
  Legend
} from 'recharts';

interface EarningsSummary {
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

interface Driver {
  id: string;
  name: string;
  user_id: string;
}

const DriverEarnings = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '14' | '30'>('7');

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    if (driver) {
      fetchEarnings(parseInt(selectedPeriod));
    }
  }, [driver, selectedPeriod]);

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/driver/auth');
        return;
      }

      const { data: driverData, error } = await supabase
        .from('drivers')
        .select('id, name, user_id')
        .eq('user_id', user.id)
        .single();

      if (error || !driverData) {
        toast({
          title: "Access Denied",
          description: "Driver profile not found",
          variant: "destructive"
        });
        navigate('/driver/auth');
        return;
      }

      setDriver(driverData);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/driver/auth');
    }
  };

  const fetchEarnings = async (days: number) => {
    if (!driver) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_driver_earnings_summary', {
        p_driver_user_id: driver.user_id,
        p_days: days
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const earningsData = data[0];
        setEarnings({
          ...earningsData,
          daily_breakdown: Array.isArray(earningsData.daily_breakdown) 
            ? earningsData.daily_breakdown as Array<{ date: string; earnings: number; rides: number }>
            : []
        });
      } else {
        // Set default empty state
        setEarnings({
          total_earnings: 0,
          total_rides: 0,
          avg_fare: 0,
          today_earnings: 0,
          yesterday_earnings: 0,
          this_week_earnings: 0,
          last_week_earnings: 0,
          daily_breakdown: []
        });
      }
    } catch (error: any) {
      console.error('Earnings fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const weeklyChange = earnings ? getPercentageChange(
    earnings.this_week_earnings, 
    earnings.last_week_earnings
  ) : 0;

  const dailyChange = earnings ? getPercentageChange(
    earnings.today_earnings, 
    earnings.yesterday_earnings
  ) : 0;

  // Chart colors
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  // Prepare chart data
  const chartData = earnings?.daily_breakdown?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    earnings: item.earnings,
    rides: item.rides
  })).reverse() || [];

  // Summary cards data
  const summaryCards = [
    {
      title: "Today's Earnings",
      value: formatCurrency(earnings?.today_earnings || 0),
      change: dailyChange,
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      title: "This Week",
      value: formatCurrency(earnings?.this_week_earnings || 0),
      change: weeklyChange,
      icon: Calendar,
      color: 'text-blue-500'
    },
    {
      title: "Total Rides",
      value: earnings?.total_rides?.toString() || '0',
      icon: Car,
      color: 'text-purple-500'
    },
    {
      title: "Avg. Fare",
      value: formatCurrency(earnings?.avg_fare || 0),
      icon: Target,
      color: 'text-orange-500'
    }
  ];

  if (isLoading && !earnings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b px-4 py-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size={isMobile ? "lg" : "icon"}
            onClick={() => navigate('/driver/dashboard')}
            className={isMobile ? "min-h-[44px] min-w-[44px] p-2" : ""}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>
              Earnings Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Track your income and performance
            </p>
          </div>
        </div>
      </header>

      <div className={`container mx-auto ${isMobile ? 'px-3 py-4' : 'px-4 py-6'} space-y-6`}>
        {/* Period Selector */}
        <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as '7' | '14' | '30')}>
          <TabsList className={`grid w-full grid-cols-3 ${isMobile ? 'h-12' : ''}`}>
            <TabsTrigger value="7" className={isMobile ? 'text-sm py-3' : ''}>
              7 Days
            </TabsTrigger>
            <TabsTrigger value="14" className={isMobile ? 'text-sm py-3' : ''}>
              14 Days
            </TabsTrigger>
            <TabsTrigger value="30" className={isMobile ? 'text-sm py-3' : ''}>
              30 Days
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Summary Cards */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-4'}`}>
          {summaryCards.map((card, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between mb-2">
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                  {card.change !== undefined && (
                    <Badge 
                      variant={card.change >= 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {card.change >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(card.change).toFixed(0)}%
                    </Badge>
                  )}
                </div>
                <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.title}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Total Earnings Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className={`${isMobile ? 'p-6' : 'p-8'} text-center`}>
            <Wallet className="h-10 w-10 mx-auto text-primary mb-4" />
            <p className="text-muted-foreground mb-2">Total Earnings ({selectedPeriod} days)</p>
            <p className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold text-primary`}>
              {formatCurrency(earnings?.total_earnings || 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              From {earnings?.total_rides || 0} completed rides
            </p>
          </CardContent>
        </Card>

        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? 'text-base' : ''}>
              Earnings Trend
            </CardTitle>
            <CardDescription>
              Daily earnings over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Earnings']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#earningsGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No earnings data available</p>
                  <p className="text-sm">Complete rides to see your earnings here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rides Chart */}
        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? 'text-base' : ''}>
              Daily Rides
            </CardTitle>
            <CardDescription>
              Number of rides completed each day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Rides']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="rides" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No ride data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
          <Card>
            <CardHeader className={isMobile ? 'pb-2' : ''}>
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
                <TrendingUp className="h-5 w-5 text-green-500" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Best Day</span>
                <span className="font-medium">
                  {chartData.length > 0 
                    ? formatCurrency(Math.max(...chartData.map(d => d.earnings)))
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Daily Average</span>
                <span className="font-medium">
                  {chartData.length > 0 
                    ? formatCurrency(chartData.reduce((sum, d) => sum + d.earnings, 0) / chartData.length)
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Most Rides (1 day)</span>
                <span className="font-medium">
                  {chartData.length > 0 
                    ? Math.max(...chartData.map(d => d.rides))
                    : 0
                  } rides
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={isMobile ? 'pb-2' : ''}>
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
                <Target className="h-5 w-5 text-orange-500" />
                Goals & Targets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Goal</span>
                  <span className="font-medium">
                    {formatCurrency(earnings?.this_week_earnings || 0)} / {formatCurrency(500000)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(((earnings?.this_week_earnings || 0) / 500000) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Goal</span>
                  <span className="font-medium">
                    {formatCurrency(earnings?.total_earnings || 0)} / {formatCurrency(2000000)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(((earnings?.total_earnings || 0) / 2000000) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DriverEarnings;
