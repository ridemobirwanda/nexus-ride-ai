import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Car, DollarSign, AlertTriangle, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

interface AdminOverviewProps {
  userRole: string | null;
  onNavigate?: (tab: string) => void;
}

interface Stats {
  totalPassengers: number;
  totalDrivers: number;
  activeRides: number;
  totalRevenue: number;
  pendingVerifications: number;
  openTickets: number;
  completedRidesToday: number;
  avgRating: number;
}

export function AdminOverview({ userRole, onNavigate }: AdminOverviewProps) {
  const [stats, setStats] = useState<Stats>({
    totalPassengers: 0,
    totalDrivers: 0,
    activeRides: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    openTickets: 0,
    completedRidesToday: 0,
    avgRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [
        passengersResult,
        driversResult,
        activeRidesResult,
        revenueResult,
        verificationsResult,
        ticketsResult,
        todayRidesResult,
        ratingsResult,
      ] = await Promise.all([
        supabase.from("passengers").select("id", { count: "exact" }),
        supabase.from("drivers").select("id", { count: "exact" }),
        supabase.from("rides").select("id", { count: "exact" }).in("status", ["accepted", "in_progress"]),
        supabase.from("rides").select("final_fare").eq("status", "completed"),
        supabase.from("driver_verification_requests").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("support_tickets").select("id", { count: "exact" }).in("status", ["open", "in_progress"]),
        supabase.from("rides").select("id", { count: "exact" }).eq("status", "completed").gte("created_at", new Date().toISOString().split('T')[0]),
        supabase.from("rides").select("rating").not("rating", "is", null),
      ]);

      const totalRevenue = revenueResult.data?.reduce((sum, ride) => sum + (ride.final_fare || 0), 0) || 0;
      const avgRating = ratingsResult.data?.reduce((sum, ride) => sum + (ride.rating || 0), 0) / (ratingsResult.data?.length || 1) || 0;

      setStats({
        totalPassengers: passengersResult.count || 0,
        totalDrivers: driversResult.count || 0,
        activeRides: activeRidesResult.count || 0,
        totalRevenue,
        pendingVerifications: verificationsResult.count || 0,
        openTickets: ticketsResult.count || 0,
        completedRidesToday: todayRidesResult.count || 0,
        avgRating: Math.round(avgRating * 10) / 10,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Passengers",
      value: stats.totalPassengers.toLocaleString(),
      icon: Users,
      description: "Registered passengers",
      color: "text-blue-500",
      navigateTo: "users",
    },
    {
      title: "Total Drivers",
      value: stats.totalDrivers.toLocaleString(),
      icon: Car,
      description: "Registered drivers",
      color: "text-green-500",
      navigateTo: "users",
    },
    {
      title: "Active Rides",
      value: stats.activeRides.toLocaleString(),
      icon: Clock,
      description: "Currently in progress",
      color: "text-orange-500",
      navigateTo: "rides",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "All-time earnings",
      color: "text-emerald-500",
      navigateTo: "financial",
    },
    {
      title: "Pending Verifications",
      value: stats.pendingVerifications.toLocaleString(),
      icon: AlertTriangle,
      description: "Awaiting review",
      color: "text-yellow-500",
      navigateTo: "verification",
    },
    {
      title: "Open Support Tickets",
      value: stats.openTickets.toLocaleString(),
      icon: AlertTriangle,
      description: "Need attention",
      color: "text-red-500",
      navigateTo: "support",
    },
    {
      title: "Rides Today",
      value: stats.completedRidesToday.toLocaleString(),
      icon: CheckCircle2,
      description: "Completed today",
      color: "text-cyan-500",
      navigateTo: "rides",
    },
    {
      title: "Average Rating",
      value: stats.avgRating.toFixed(1),
      icon: TrendingUp,
      description: "System-wide rating",
      color: "text-purple-500",
      navigateTo: "analytics",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <Badge variant="outline">Loading...</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
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
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <Badge variant="outline">Last updated: {new Date().toLocaleTimeString()}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card 
            key={index} 
            className="gradient-card border-primary/10 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => onNavigate?.(card.navigateTo)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color} group-hover:scale-110 transition-transform`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{card.value}</div>
              <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gradient-card border-primary/10">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Review Driver Verifications</span>
              <Badge variant={stats.pendingVerifications > 0 ? "destructive" : "secondary"}>
                {stats.pendingVerifications}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Open Support Tickets</span>
              <Badge variant={stats.openTickets > 0 ? "destructive" : "secondary"}>
                {stats.openTickets}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Active Rides</span>
              <Badge variant="outline">{stats.activeRides}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-primary/10">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Overall platform health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Platform Status</span>
              <Badge variant="default" className="bg-green-500">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Response Time</span>
              <Badge variant="outline">1.2s</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">System Uptime</span>
              <Badge variant="outline">99.9%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}