import { useEffect, useState, useRef } from "react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, Eye, MapPin, Clock, DollarSign, Zap, ChevronDown, ChevronUp, User, Car, Star, MessageSquare, X, Check, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAutoDispatch } from "@/hooks/useAutoDispatch";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Mobile swipeable card component
interface MobileRideCardProps {
  ride: Ride;
  onAutoAssign: (rideId: string) => void;
  getStatusBadgeVariant: (status: string) => "default" | "secondary" | "outline" | "destructive";
}

const MobileRideCard = ({ ride, onAutoAssign, getStatusBadgeVariant }: MobileRideCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    // Limit swipe distance
    const limitedDiff = Math.max(-120, Math.min(120, diff));
    setSwipeX(limitedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    // Reset position with animation
    setSwipeX(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "accepted": return "bg-yellow-500";
      case "cancelled": return "bg-destructive";
      case "pending": return "bg-orange-500";
      default: return "bg-muted";
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg mb-3">
      {/* Swipe action buttons (revealed on swipe) */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <Button
          variant="default"
          size="sm"
          className="h-full rounded-none px-4 bg-green-600 hover:bg-green-700"
          onClick={() => onAutoAssign(ride.id)}
        >
          <Check className="w-5 h-5" />
        </Button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center">
        <Button
          variant="destructive"
          size="sm"
          className="h-full rounded-none px-4"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main card content */}
      <div
        ref={cardRef}
        className="relative bg-card border border-border rounded-lg transition-transform duration-200 ease-out touch-pan-y"
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <div className="p-4 cursor-pointer active:bg-muted/50 transition-colors">
              {/* Status indicator bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(ride.status)} rounded-t-lg`} />
              
              {/* Header row */}
              <div className="flex items-start justify-between mb-3 pt-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{ride.passenger_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Car className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{ride.driver_name || "Awaiting driver"}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <Badge variant={getStatusBadgeVariant(ride.status)} className="capitalize text-xs">
                    {ride.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm font-semibold text-primary">
                    {ride.final_fare ? `$${ride.final_fare.toFixed(2)}` : 
                     ride.estimated_fare ? `~$${ride.estimated_fare.toFixed(2)}` : "TBD"}
                  </span>
                </div>
              </div>

              {/* Route preview */}
              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground line-clamp-1">{ride.pickup_address}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground line-clamp-1">{ride.dropoff_address}</p>
                </div>
              </div>

              {/* Footer with time and expand button */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(ride.created_at).toLocaleDateString()} • {new Date(ride.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Details</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
              {/* Trip metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <MapPin className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="text-sm font-medium">{ride.distance_km ? `${ride.distance_km.toFixed(1)} km` : "N/A"}</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">{ride.duration_minutes ? `${ride.duration_minutes} min` : "N/A"}</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <Star className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-sm font-medium">{ride.rating ? `${ride.rating}/5` : "N/A"}</p>
                </div>
              </div>

              {/* Full addresses */}
              <div className="space-y-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-green-600">Pickup</span>
                  </div>
                  <p className="text-sm text-foreground">{ride.pickup_address}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium text-red-600">Dropoff</span>
                  </div>
                  <p className="text-sm text-foreground">{ride.dropoff_address}</p>
                </div>
              </div>

              {/* Fare details */}
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Fare</p>
                  <p className="text-sm font-medium">{ride.estimated_fare ? `$${ride.estimated_fare.toFixed(2)}` : "N/A"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Final Fare</p>
                  <p className="text-lg font-bold text-primary">{ride.final_fare ? `$${ride.final_fare.toFixed(2)}` : "TBD"}</p>
                </div>
              </div>

              {/* Feedback */}
              {ride.feedback && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium">Feedback</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{ride.feedback}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {ride.status === 'pending' && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onAutoAssign(ride.id)}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Auto-Assign Driver
                  </Button>
                )}
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export function RideManagement({ userRole }: RideManagementProps) {
  const isMobile = useIsMobile();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { triggerAutoDispatch } = useAutoDispatch({ enabled: false });
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

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

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
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

  // Desktop table component
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
            <TableHead className="hidden lg:table-cell">Route</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fare</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rides.map((ride) => (
          <TableRow key={ride.id}>
            <TableCell className="font-medium">{ride.passenger_name}</TableCell>
            <TableCell>{ride.driver_name || "Not assigned"}</TableCell>
            <TableCell className="max-w-xs hidden lg:table-cell">
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{ride.pickup_address.substring(0, 30)}...</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{ride.dropoff_address.substring(0, 30)}...</span>
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
            <TableCell className="hidden md:table-cell">{new Date(ride.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {ride.status === 'pending' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => triggerAutoDispatch(ride.id)}
                    className="h-8 hidden sm:flex"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Auto-Assign
                  </Button>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRide(ride)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Ride Details</DialogTitle>
                    <DialogDescription>
                      Complete information about ride #{ride.id.substring(0, 8)}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedRide && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              <span className="text-right">{new Date(selectedRide.created_at).toLocaleString()}</span>
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    );
  };

  // Mobile rides list
  const MobileRidesList = ({ rides }: { rides: Ride[] }) => {
    if (rides.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No rides found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm 
              ? "No rides match your search criteria."
              : "No rides in the system yet."
            }
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {rides.map((ride) => (
          <MobileRideCard
            key={ride.id}
            ride={ride}
            onAutoAssign={triggerAutoDispatch}
            getStatusBadgeVariant={getStatusBadgeVariant}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">Ride Management</h2>
        </div>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 sm:h-10 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Ride Management</h2>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search rides..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Rides</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{rides.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {ridesByStatus.accepted.length + ridesByStatus.in_progress.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {rides.filter(r => 
                r.status === 'completed' && 
                new Date(r.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-primary">
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

      {/* Tabs with responsive content */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:w-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3">
              All <span className="hidden sm:inline ml-1">({ridesByStatus.all.length})</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 sm:px-3">
              Pending <span className="hidden sm:inline ml-1">({ridesByStatus.pending.length})</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs sm:text-sm px-2 sm:px-3">
              Active <span className="hidden sm:inline ml-1">({ridesByStatus.in_progress.length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm px-2 sm:px-3">
              Done <span className="hidden sm:inline ml-1">({ridesByStatus.completed.length})</span>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs sm:text-sm px-2 sm:px-3">
              Cancelled
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-2 sm:p-6">
              {isMobile ? (
                <MobileRidesList rides={ridesByStatus.all} />
              ) : (
                <RideTable rides={ridesByStatus.all} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-2 sm:p-6">
              {isMobile ? (
                <MobileRidesList rides={ridesByStatus.pending} />
              ) : (
                <RideTable rides={ridesByStatus.pending} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in_progress">
          <Card>
            <CardContent className="p-2 sm:p-6">
              {isMobile ? (
                <MobileRidesList rides={ridesByStatus.in_progress} />
              ) : (
                <RideTable rides={ridesByStatus.in_progress} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardContent className="p-2 sm:p-6">
              {isMobile ? (
                <MobileRidesList rides={ridesByStatus.completed} />
              ) : (
                <RideTable rides={ridesByStatus.completed} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancelled">
          <Card>
            <CardContent className="p-2 sm:p-6">
              {isMobile ? (
                <MobileRidesList rides={ridesByStatus.cancelled} />
              ) : (
                <RideTable rides={ridesByStatus.cancelled} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}