import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Eye, MapPin, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RideManagementProps {
  userRole: string | null;
}

interface Ride {
  id: string;
  passenger_name: string;
  driver_name: string | null;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  created_at: string;
  final_fare: number | null;
  estimated_fare: number | null;
  distance_km: number | null;
  duration_minutes: number | null;
  rating: number | null;
  feedback: string | null;
}

export function RideManagement({ userRole }: RideManagementProps) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const { data, error } = await supabase
        .from("rides")
        .select(`
          id,
          pickup_address,
          dropoff_address,
          status,
          created_at,
          final_fare,
          estimated_fare,
          distance_km,
          duration_minutes,
          rating,
          feedback,
          passengers!inner(name),
          drivers(name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedRides = data?.map(ride => ({
        id: ride.id,
        passenger_name: ride.passengers?.name || "Unknown",
        driver_name: ride.drivers?.name || null,
        pickup_address: ride.pickup_address,
        dropoff_address: ride.dropoff_address,
        status: ride.status,
        created_at: ride.created_at,
        final_fare: ride.final_fare,
        estimated_fare: ride.estimated_fare,
        distance_km: ride.distance_km,
        duration_minutes: ride.duration_minutes,
        rating: ride.rating,
        feedback: ride.feedback,
      })) || [];

      setRides(formattedRides);
    } catch (error) {
      console.error("Error fetching rides:", error);
      toast({
        title: "Error",
        description: "Failed to fetch rides data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "accepted":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredRides = rides.filter(ride =>
    ride.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ride.driver_name && ride.driver_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    ride.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.dropoff_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ridesByStatus = {
    all: filteredRides,
    pending: filteredRides.filter(r => r.status === 'pending'),
    accepted: filteredRides.filter(r => r.status === 'accepted'),
    in_progress: filteredRides.filter(r => r.status === 'in_progress'),
    completed: filteredRides.filter(r => r.status === 'completed'),
    cancelled: filteredRides.filter(r => r.status === 'cancelled'),
  };

  const RideTable = ({ rides }: { rides: Ride[] }) => {
    if (rides.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No rides found</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {searchTerm 
              ? "No rides match your search criteria. Try adjusting your search."
              : "There are no rides in the system yet. Rides will appear here once passengers start booking."
            }
          </p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Passenger</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fare</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rides.map((ride) => (
          <TableRow key={ride.id}>
            <TableCell className="font-medium">{ride.passenger_name}</TableCell>
            <TableCell>{ride.driver_name || "Not assigned"}</TableCell>
            <TableCell className="max-w-xs">
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1" />
                  {ride.pickup_address.substring(0, 30)}...
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1" />
                  {ride.dropoff_address.substring(0, 30)}...
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(ride.status)} className="capitalize">
                {ride.status.replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell>
              {ride.final_fare ? (
                `$${ride.final_fare.toFixed(2)}`
              ) : ride.estimated_fare ? (
                `~$${ride.estimated_fare.toFixed(2)}`
              ) : (
                "TBD"
              )}
            </TableCell>
            <TableCell>{new Date(ride.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedRide(ride)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ride Details</DialogTitle>
                    <DialogDescription>
                      Complete information about ride #{ride.id.substring(0, 8)}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedRide && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Ride Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ride ID:</span>
                              <span>{selectedRide.id.substring(0, 8)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant={getStatusBadgeVariant(selectedRide.status)} className="capitalize">
                                {selectedRide.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Created:</span>
                              <span>{new Date(selectedRide.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Participants</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Passenger:</span>
                              <span>{selectedRide.passenger_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Driver:</span>
                              <span>{selectedRide.driver_name || "Not assigned"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Route Details</h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center text-sm font-medium text-green-600 mb-1">
                              <MapPin className="w-4 h-4 mr-2" />
                              Pickup Location
                            </div>
                            <p className="text-sm text-muted-foreground pl-6">{selectedRide.pickup_address}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center text-sm font-medium text-red-600 mb-1">
                              <MapPin className="w-4 h-4 mr-2" />
                              Dropoff Location
                            </div>
                            <p className="text-sm text-muted-foreground pl-6">{selectedRide.dropoff_address}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Trip Metrics</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Distance:</span>
                              <span>{selectedRide.distance_km ? `${selectedRide.distance_km.toFixed(1)} km` : "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Duration:</span>
                              <span>{selectedRide.duration_minutes ? `${selectedRide.duration_minutes} min` : "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rating:</span>
                              <span>{selectedRide.rating ? `${selectedRide.rating}/5` : "Not rated"}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Fare Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Estimated:</span>
                              <span>{selectedRide.estimated_fare ? `$${selectedRide.estimated_fare.toFixed(2)}` : "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Final:</span>
                              <span className="font-medium">
                                {selectedRide.final_fare ? `$${selectedRide.final_fare.toFixed(2)}` : "TBD"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedRide.feedback && (
                        <div>
                          <h4 className="font-medium mb-2">Feedback</h4>
                          <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                            {selectedRide.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Ride Management</h2>
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
        <h2 className="text-2xl font-bold">Ride Management</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search rides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rides.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ridesByStatus.accepted.length + ridesByStatus.in_progress.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rides.filter(r => 
                r.status === 'completed' && 
                new Date(r.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${rides
                .filter(r => 
                  r.status === 'completed' && 
                  r.final_fare &&
                  new Date(r.created_at).toDateString() === new Date().toDateString()
                )
                .reduce((sum, r) => sum + (r.final_fare || 0), 0)
                .toFixed(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({ridesByStatus.all.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({ridesByStatus.pending.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({ridesByStatus.in_progress.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({ridesByStatus.completed.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({ridesByStatus.cancelled.length})</TabsTrigger>
        </TabsList>

        {Object.entries(ridesByStatus).map(([status, rides]) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">
                  {status === 'all' ? 'All Rides' : `${status.replace('_', ' ')} Rides`}
                </CardTitle>
                <CardDescription>
                  {status === 'all' 
                    ? 'Complete overview of all rides in the system'
                    : `Rides currently in ${status.replace('_', ' ')} status`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RideTable rides={rides} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}