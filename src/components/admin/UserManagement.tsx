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
import { Search, UserX, UserCheck, MoreHorizontal, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserManagementProps {
  userRole: string | null;
}

interface User {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
  user_id: string;
  user_type: 'passenger' | 'driver';
  status?: string;
  rating?: number;
  total_trips?: number;
}

export function UserManagement({ userRole }: UserManagementProps) {
  const [passengers, setPassengers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [passengersResult, driversResult] = await Promise.all([
        supabase
          .from("passengers")
          .select("id, name, phone, created_at, user_id")
          .order("created_at", { ascending: false }),
        supabase
          .from("drivers")
          .select("id, name, phone, created_at, user_id, status, rating, total_trips")
          .order("created_at", { ascending: false }),
      ]);

      if (passengersResult.data) {
        setPassengers(passengersResult.data.map(p => ({ ...p, user_type: 'passenger' as const })));
      }

      if (driversResult.data) {
        setDrivers(driversResult.data.map(d => ({ ...d, user_type: 'driver' as const })));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (user: User) => {
    // Implementation for suspending users would go here
    toast({
      title: "Action Required",
      description: "User suspension functionality needs to be implemented.",
    });
  };

  const filteredPassengers = passengers.filter(passenger =>
    passenger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (passenger.phone && passenger.phone.includes(searchTerm))
  );

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.phone && driver.phone.includes(searchTerm))
  );

  const UserTable = ({ users, type }: { users: User[], type: 'passenger' | 'driver' }) => {
    if (users.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
          <UserCheck className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">No {type}s found</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md px-4">
            {searchTerm 
              ? `No ${type}s match your search criteria. Try adjusting your search.`
              : `There are no ${type}s registered in the system yet.`
            }
          </p>
        </div>
      );
    }

    // Mobile card view
    const MobileUserCard = ({ user }: { user: User }) => (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{user.name}</h4>
              <p className="text-xs text-muted-foreground">{user.phone || "No phone"}</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedUser(user)}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg">User Details</DialogTitle>
                  <DialogDescription>
                    Manage {user.name}'s account
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h4 className="font-medium text-sm">Name</h4>
                      <p className="text-sm text-muted-foreground">{user.name}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Phone</h4>
                      <p className="text-sm text-muted-foreground">{user.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">User Type</h4>
                      <Badge variant="outline" className="capitalize text-xs">{user.user_type}</Badge>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Member Since</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSuspendUser(user)}
                      disabled={userRole !== 'super_admin'}
                      className="flex-1"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Suspend User
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Shield className="w-4 h-4 mr-2" />
                      View Activity
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {type === 'driver' && (
                <>
                  <Badge 
                    variant={user.status === 'available' ? 'default' : 'secondary'}
                    className="capitalize text-xs"
                  >
                    {user.status || 'offline'}
                  </Badge>
                  <span className="text-muted-foreground">★ {user.rating?.toFixed(1) || 'N/A'}</span>
                  <span className="text-muted-foreground">{user.total_trips || 0} trips</span>
                </>
              )}
            </div>
            <span className="text-muted-foreground">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    );

    return (
      <>
        {/* Mobile view - cards */}
        <div className="block md:hidden">
          {users.map((user) => (
            <MobileUserCard key={user.id} user={user} />
          ))}
        </div>

        {/* Desktop view - table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Name</TableHead>
                <TableHead className="min-w-[100px]">Phone</TableHead>
                {type === 'driver' && (
                  <>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Trips</TableHead>
                  </>
                )}
                <TableHead>Joined</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.phone || "Not provided"}</TableCell>
                  {type === 'driver' && (
                    <>
                      <TableCell>
                        <Badge 
                          variant={user.status === 'available' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {user.status || 'offline'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.rating?.toFixed(1) || 'N/A'}</TableCell>
                      <TableCell>{user.total_trips || 0}</TableCell>
                    </>
                  )}
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>User Details</DialogTitle>
                          <DialogDescription>
                            Manage {user.name}'s account
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">Name</h4>
                              <p className="text-sm text-muted-foreground">{user.name}</p>
                            </div>
                            <div>
                              <h4 className="font-medium">Phone</h4>
                              <p className="text-sm text-muted-foreground">{user.phone || "Not provided"}</p>
                            </div>
                            <div>
                              <h4 className="font-medium">User Type</h4>
                              <Badge variant="outline" className="capitalize">{user.user_type}</Badge>
                            </div>
                            <div>
                              <h4 className="font-medium">Member Since</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSuspendUser(user)}
                              disabled={userRole !== 'super_admin'}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Suspend User
                            </Button>
                            <Button variant="outline" size="sm">
                              <Shield className="w-4 h-4 mr-2" />
                              View Activity
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">User Management</h2>
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64 h-11 sm:h-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Passengers</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{passengers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Drivers</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{drivers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {drivers.filter(d => d.status === 'available').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="passengers" className="space-y-3 sm:space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="passengers" className="text-xs sm:text-sm">
            Passengers ({filteredPassengers.length})
          </TabsTrigger>
          <TabsTrigger value="drivers" className="text-xs sm:text-sm">
            Drivers ({filteredDrivers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="passengers">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Passenger Accounts</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage passenger accounts and view their activity
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <UserTable users={filteredPassengers} type="passenger" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Driver Accounts</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage driver accounts, status, and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <UserTable users={filteredDrivers} type="driver" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}