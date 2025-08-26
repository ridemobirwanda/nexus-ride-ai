import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Car, DollarSign, Clock, Star, MapPin, Calendar } from "lucide-react";

interface ReportsAnalyticsProps {
  userRole: string | null;
}

interface AnalyticsData {
  totalRides: number;
  totalRevenue: number;
  avgRideDistance: number;
  avgRideDuration: number;
  avgRating: number;
  topPickupLocations: Array<{ location: string; count: number }>;
  dailyStats: Array<{ date: string; rides: number; revenue: number }>;
  driverStats: Array<{ name: string; rides: number; earnings: number; rating: number }>;
}

export function ReportsAnalytics({ userRole }: ReportsAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRides: 0,
    totalRevenue: 0,
    avgRideDistance: 0,
    avgRideDuration: 0,
    avgRating: 0,
    topPickupLocations: [],
    dailyStats: [],
    driverStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d"); // 7d, 30d, 90d

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch completed rides
      const { data: rides, error: ridesError } = await supabase
        .from("rides")
        .select(`
          id,
          final_fare,
          distance_km,
          duration_minutes,
          rating,
          pickup_address,
          created_at,
          drivers!inner(name)
        `)
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString());

      if (ridesError) throw ridesError;

      // Calculate basic stats
      const totalRides = rides?.length || 0;
      const totalRevenue = rides?.reduce((sum, ride) => sum + (ride.final_fare || 0), 0) || 0;
      const avgRideDistance = rides?.length 
        ? rides.reduce((sum, ride) => sum + (ride.distance_km || 0), 0) / rides.length 
        : 0;
      const avgRideDuration = rides?.length 
        ? rides.reduce((sum, ride) => sum + (ride.duration_minutes || 0), 0) / rides.length 
        : 0;
      const avgRating = rides?.filter(r => r.rating).length 
        ? rides.filter(r => r.rating).reduce((sum, ride) => sum + (ride.rating || 0), 0) / rides.filter(r => r.rating).length 
        : 0;

      // Top pickup locations
      const locationCounts: { [key: string]: number } = {};
      rides?.forEach(ride => {
        const location = ride.pickup_address.split(',')[0]; // First part of address
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      });
      const topPickupLocations = Object.entries(locationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([location, count]) => ({ location, count }));

      // Daily stats
      const dailyStats: { [key: string]: { rides: number; revenue: number } } = {};
      rides?.forEach(ride => {
        const date = new Date(ride.created_at).toDateString();
        if (!dailyStats[date]) {
          dailyStats[date] = { rides: 0, revenue: 0 };
        }
        dailyStats[date].rides += 1;
        dailyStats[date].revenue += ride.final_fare || 0;
      });

      const dailyStatsArray = Object.entries(dailyStats)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Driver stats
      const driverStats: { [key: string]: { rides: number; earnings: number; ratings: number[] } } = {};
      rides?.forEach(ride => {
        const driverName = ride.drivers?.name || "Unknown";
        if (!driverStats[driverName]) {
          driverStats[driverName] = { rides: 0, earnings: 0, ratings: [] };
        }
        driverStats[driverName].rides += 1;
        driverStats[driverName].earnings += ride.final_fare || 0;
        if (ride.rating) {
          driverStats[driverName].ratings.push(ride.rating);
        }
      });

      const driverStatsArray = Object.entries(driverStats)
        .map(([name, stats]) => ({
          name,
          rides: stats.rides,
          earnings: stats.earnings,
          rating: stats.ratings.length 
            ? stats.ratings.reduce((sum, r) => sum + r, 0) / stats.ratings.length 
            : 0,
        }))
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 10);

      setAnalytics({
        totalRides,
        totalRevenue,
        avgRideDistance,
        avgRideDuration,
        avgRating,
        topPickupLocations,
        dailyStats: dailyStatsArray,
        driverStats: driverStatsArray,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description }: {
    title: string;
    value: string;
    icon: any;
    color: string;
    description: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <div className="flex gap-2">
          <Badge 
            variant={timeRange === "7d" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTimeRange("7d")}
          >
            7 Days
          </Badge>
          <Badge 
            variant={timeRange === "30d" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTimeRange("30d")}
          >
            30 Days
          </Badge>
          <Badge 
            variant={timeRange === "90d" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTimeRange("90d")}
          >
            90 Days
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Rides"
          value={analytics.totalRides.toLocaleString()}
          icon={Car}
          color="text-blue-500"
          description={`Last ${timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"} days`}
        />
        <StatCard
          title="Total Revenue"
          value={`$${analytics.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="text-green-500"
          description="Gross revenue"
        />
        <StatCard
          title="Avg Distance"
          value={`${analytics.avgRideDistance.toFixed(1)} km`}
          icon={MapPin}
          color="text-orange-500"
          description="Per ride"
        />
        <StatCard
          title="Avg Duration"
          value={`${analytics.avgRideDuration.toFixed(0)} min`}
          icon={Clock}
          color="text-purple-500"
          description="Per ride"
        />
        <StatCard
          title="Avg Rating"
          value={analytics.avgRating.toFixed(1)}
          icon={Star}
          color="text-yellow-500"
          description="System-wide"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drivers">Driver Performance</TabsTrigger>
          <TabsTrigger value="locations">Popular Locations</TabsTrigger>
          <TabsTrigger value="trends">Daily Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.dailyStats.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{day.rides} rides</span>
                        <span className="font-medium">${day.revenue.toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>Important platform indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Ride Value</span>
                    <span className="font-medium">
                      ${analytics.totalRides > 0 ? (analytics.totalRevenue / analytics.totalRides).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rides per Day</span>
                    <span className="font-medium">
                      {analytics.dailyStats.length > 0 
                        ? Math.round(analytics.totalRides / analytics.dailyStats.length)
                        : 0
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Revenue per Day</span>
                    <span className="font-medium">
                      ${analytics.dailyStats.length > 0 
                        ? Math.round(analytics.totalRevenue / analytics.dailyStats.length)
                        : 0
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Drivers</CardTitle>
              <CardDescription>Drivers by earnings and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.driverStats.map((driver, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">{driver.rides} rides</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${driver.earnings.toFixed(0)}</p>
                      <p className="text-sm text-muted-foreground">
                        {driver.rating > 0 ? `${driver.rating.toFixed(1)} ⭐` : "No ratings"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Popular Pickup Locations</CardTitle>
              <CardDescription>Most requested pickup areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topPickupLocations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{location.location}</p>
                        <p className="text-sm text-muted-foreground">Pickup location</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{location.count} rides</p>
                      <p className="text-sm text-muted-foreground">
                        {((location.count / analytics.totalRides) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity Trends</CardTitle>
              <CardDescription>Ride volume and revenue by day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.dailyStats.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{day.rides} rides</p>
                      <p className="text-sm text-muted-foreground">${day.revenue.toFixed(0)} revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}