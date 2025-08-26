import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, Users, Car, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ActivityLog {
  id: string;
  user_id: string;
  user_type: 'passenger' | 'driver' | 'admin';
  activity_type: string;
  activity_details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface ActivityTrackerProps {
  userRole: string | null;
}

export function ActivityTracker({ userRole }: ActivityTrackerProps) {
  const [passengerActivities, setPassengerActivities] = useState<ActivityLog[]>([]);
  const [driverActivities, setDriverActivities] = useState<ActivityLog[]>([]);
  const [adminActivities, setAdminActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFilter, setActivityFilter] = useState<string>("all");

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      const { data: activities, error } = await supabase
        .from("user_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Group activities by user type
      const passengers = activities?.filter(a => a.user_type === 'passenger').map(a => ({
        ...a,
        user_type: a.user_type as 'passenger',
        ip_address: a.ip_address as string | null
      })) || [];
      const drivers = activities?.filter(a => a.user_type === 'driver').map(a => ({
        ...a,
        user_type: a.user_type as 'driver',
        ip_address: a.ip_address as string | null
      })) || [];
      const admins = activities?.filter(a => a.user_type === 'admin').map(a => ({
        ...a,
        user_type: a.user_type as 'admin',
        ip_address: a.ip_address as string | null
      })) || [];

      setPassengerActivities(passengers);
      setDriverActivities(drivers);
      setAdminActivities(admins);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'login': return 'default';
      case 'logout': return 'secondary';
      case 'ride_request': return 'default';
      case 'ride_complete': return 'default';
      case 'ride_cancel': return 'destructive';
      case 'profile_update': return 'secondary';
      default: return 'outline';
    }
  };

  const filterActivities = (activities: ActivityLog[]) => {
    let filtered = activities;
    
    if (activityFilter !== 'all') {
      filtered = filtered.filter(activity => activity.activity_type === activityFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.activity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.user_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const ActivityTable = ({ activities, type }: { activities: ActivityLog[], type: string }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User ID</TableHead>
          <TableHead>Activity</TableHead>
          <TableHead>Details</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead>Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filterActivities(activities).slice(0, 50).map((activity) => (
          <TableRow key={activity.id}>
            <TableCell className="font-mono text-sm">
              {activity.user_id.substring(0, 8)}...
            </TableCell>
            <TableCell>
              <Badge variant={getActivityColor(activity.activity_type) as any}>
                {activity.activity_type.replace('_', ' ').toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="max-w-xs truncate text-sm">
                {JSON.stringify(activity.activity_details)}
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs">
              {activity.ip_address || 'N/A'}
            </TableCell>
            <TableCell className="text-sm">
              {new Date(activity.created_at).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Activity Tracking</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Activity Tracking</h2>
        <div className="flex items-center gap-4">
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="ride_request">Ride Request</SelectItem>
              <SelectItem value="ride_complete">Ride Complete</SelectItem>
              <SelectItem value="ride_cancel">Ride Cancel</SelectItem>
              <SelectItem value="profile_update">Profile Update</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={fetchActivityLogs} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Passenger Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passengerActivities.length}</div>
            <p className="text-xs text-muted-foreground">Total logged activities</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="w-4 h-4" />
              Driver Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driverActivities.length}</div>
            <p className="text-xs text-muted-foreground">Total logged activities</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...passengerActivities, ...driverActivities, ...adminActivities]
                .filter(a => new Date(a.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000))
                .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="passengers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="passengers">
            Passengers ({passengerActivities.length})
          </TabsTrigger>
          <TabsTrigger value="drivers">
            Drivers ({driverActivities.length})
          </TabsTrigger>
          <TabsTrigger value="admins">
            Admins ({adminActivities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="passengers">
          <Card>
            <CardHeader>
              <CardTitle>Passenger Activity Logs</CardTitle>
              <CardDescription>
                Track passenger login, ride requests, and other activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTable activities={passengerActivities} type="passenger" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle>Driver Activity Logs</CardTitle>
              <CardDescription>
                Monitor driver activity, ride completions, and status changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTable activities={driverActivities} type="driver" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle>Admin Activity Logs</CardTitle>
              <CardDescription>
                Administrative actions and system management activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTable activities={adminActivities} type="admin" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}