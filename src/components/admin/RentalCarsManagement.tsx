import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Car, Plus, Edit, Trash2, Image as ImageIcon, Calendar, DollarSign, Users, MapPin, Eye, CheckCircle, XCircle, Phone, FileText, CreditCard, Clock, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RentalCarImageUpload } from "./RentalCarImageUpload";

interface RentalCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  car_type: string;
  fuel_type: string;
  seating_capacity: number;
  price_per_hour: number;
  price_per_day: number;
  availability_status: string;
  is_active: boolean;
  description: string | null;
  features: any;
  plate_number: string | null;
  location_address: string | null;
  owner_name: string | null;
  owner_phone: string | null;
}

interface RentalCarImage {
  id: string;
  car_id: string;
  image_url: string;
  is_primary: boolean;
  caption: string | null;
  display_order: number | null;
}

interface CarRental {
  id: string;
  rental_start: string;
  rental_end: string;
  status: string;
  total_price: number;
  user_id: string;
  car_id: string;
  pickup_location: string | null;
  return_location: string | null;
  contact_phone: string;
  driver_license_number: string | null;
  special_requests: string | null;
  duration_type: string;
  duration_value: number;
}

interface RentalCarsManagementProps {
  userRole: string | null;
}

export function RentalCarsManagement({ userRole }: RentalCarsManagementProps) {
  const [cars, setCars] = useState<RentalCar[]>([]);
  const [carImages, setCarImages] = useState<Record<string, RentalCarImage[]>>({});
  const [rentals, setRentals] = useState<CarRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedCarForImages, setSelectedCarForImages] = useState<RentalCar | null>(null);
  const [editingCar, setEditingCar] = useState<RentalCar | null>(null);
  const [deletingCarId, setDeletingCarId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<CarRental | null>(null);
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    car_type: "Sedan",
    fuel_type: "Petrol",
    seating_capacity: 5,
    price_per_hour: 0,
    price_per_day: 0,
    availability_status: "available",
    is_active: true,
    description: "",
    plate_number: "",
    location_address: "",
    owner_name: "",
    owner_phone: "",
    features: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [carsResponse, rentalsResponse, imagesResponse] = await Promise.all([
        supabase.from("rental_cars").select("*").order("created_at", { ascending: false }),
        supabase.from("car_rentals").select("*").order("created_at", { ascending: false }),
        supabase.from("rental_car_images").select("*").order("display_order", { ascending: true }),
      ]);

      if (carsResponse.error) throw carsResponse.error;
      if (rentalsResponse.error) throw rentalsResponse.error;

      setCars(carsResponse.data || []);
      setRentals(rentalsResponse.data || []);
      
      // Group images by car_id
      const imagesByCarId: Record<string, RentalCarImage[]> = {};
      (imagesResponse.data || []).forEach((img) => {
        if (!imagesByCarId[img.car_id]) {
          imagesByCarId[img.car_id] = [];
        }
        imagesByCarId[img.car_id].push(img);
      });
      setCarImages(imagesByCarId);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load rental cars data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const carData = {
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        car_type: formData.car_type,
        fuel_type: formData.fuel_type,
        seating_capacity: formData.seating_capacity,
        price_per_hour: formData.price_per_hour,
        price_per_day: formData.price_per_day,
        availability_status: formData.availability_status,
        is_active: formData.is_active,
        description: formData.description,
        plate_number: formData.plate_number,
        location_address: formData.location_address,
        owner_name: formData.owner_name,
        owner_phone: formData.owner_phone,
        features: formData.features,
      };

      if (editingCar) {
        const { error } = await supabase
          .from("rental_cars")
          .update(carData)
          .eq("id", editingCar.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Rental car updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("rental_cars")
          .insert([carData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Rental car added successfully",
        });
      }

      setIsAddDialogOpen(false);
      setEditingCar(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving car:", error);
      toast({
        title: "Error",
        description: "Failed to save rental car",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingCarId) return;

    try {
      const { error } = await supabase
        .from("rental_cars")
        .delete()
        .eq("id", deletingCarId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rental car deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting car:", error);
      toast({
        title: "Error",
        description: "Failed to delete rental car",
        variant: "destructive",
      });
    } finally {
      setDeletingCarId(null);
    }
  };

  const handleEdit = (car: RentalCar) => {
    setEditingCar(car);
    setFormData({
      brand: car.brand,
      model: car.model,
      year: car.year,
      car_type: car.car_type,
      fuel_type: car.fuel_type,
      seating_capacity: car.seating_capacity,
      price_per_hour: car.price_per_hour,
      price_per_day: car.price_per_day,
      availability_status: car.availability_status,
      is_active: car.is_active,
      description: car.description || "",
      plate_number: car.plate_number || "",
      location_address: car.location_address || "",
      owner_name: car.owner_name || "",
      owner_phone: car.owner_phone || "",
      features: Array.isArray(car.features) ? car.features : [],
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      car_type: "Sedan",
      fuel_type: "Petrol",
      seating_capacity: 5,
      price_per_hour: 0,
      price_per_day: 0,
      availability_status: "available",
      is_active: true,
      description: "",
      plate_number: "",
      location_address: "",
      owner_name: "",
      owner_phone: "",
      features: [],
    });
  };

  const filteredCars = cars.filter(car => {
    const matchesSearch = 
      car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.plate_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "active" && car.is_active) ||
      (filterStatus === "inactive" && !car.is_active) ||
      car.availability_status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: cars.length,
    active: cars.filter(c => c.is_active).length,
    available: cars.filter(c => c.availability_status === "available").length,
    rented: cars.filter(c => c.availability_status === "rented").length,
    totalBookings: rentals.length,
    activeBookings: rentals.filter(r => r.status === "active" || r.status === "confirmed").length,
    pendingBookings: rentals.filter(r => r.status === "pending").length,
  };

  const filteredRentals = rentals.filter(rental => {
    if (bookingFilter === "all") return true;
    return rental.status === bookingFilter;
  });

  const handleUpdateBookingStatus = async (rentalId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("car_rentals")
        .update({ status: newStatus })
        .eq("id", rentalId);

      if (error) throw error;

      // If booking is confirmed/active, update car availability
      if (newStatus === "active" || newStatus === "confirmed") {
        const rental = rentals.find(r => r.id === rentalId);
        if (rental) {
          await supabase
            .from("rental_cars")
            .update({ availability_status: "rented" })
            .eq("id", rental.car_id);
        }
      } else if (newStatus === "completed" || newStatus === "cancelled") {
        const rental = rentals.find(r => r.id === rentalId);
        if (rental) {
          await supabase
            .from("rental_cars")
            .update({ availability_status: "available" })
            .eq("id", rental.car_id);
        }
      }

      toast({
        title: "Success",
        description: `Booking status updated to ${newStatus}`,
      });

      fetchData();
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  const handleOpenImagesDialog = (car: RentalCar) => {
    setSelectedCarForImages(car);
    setIsImageDialogOpen(true);
  };

  const handleImagesUpdate = (images: RentalCarImage[]) => {
    if (selectedCarForImages) {
      setCarImages(prev => ({
        ...prev,
        [selectedCarForImages.id]: images,
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Rental Cars Management</h2>
          <p className="text-muted-foreground">Manage your rental car fleet and bookings</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingCar(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Rental Car
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCar ? "Edit" : "Add"} Rental Car</DialogTitle>
              <DialogDescription>
                {editingCar ? "Update" : "Add"} rental car details to your fleet
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="car_type">Type</Label>
                  <Select value={formData.car_type} onValueChange={(value) => setFormData({ ...formData, car_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sedan">Sedan</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="Hatchback">Hatchback</SelectItem>
                      <SelectItem value="Luxury">Luxury</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel_type">Fuel Type</Label>
                  <Select value={formData.fuel_type} onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Electric">Electric</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seating_capacity">Seats</Label>
                  <Input
                    id="seating_capacity"
                    type="number"
                    value={formData.seating_capacity}
                    onChange={(e) => setFormData({ ...formData, seating_capacity: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_hour">Price/Hour ($)</Label>
                  <Input
                    id="price_per_hour"
                    type="number"
                    step="0.01"
                    value={formData.price_per_hour}
                    onChange={(e) => setFormData({ ...formData, price_per_hour: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_day">Price/Day ($)</Label>
                  <Input
                    id="price_per_day"
                    type="number"
                    step="0.01"
                    value={formData.price_per_day}
                    onChange={(e) => setFormData({ ...formData, price_per_day: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plate_number">Plate Number</Label>
                  <Input
                    id="plate_number"
                    value={formData.plate_number}
                    onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability_status">Status</Label>
                  <Select value={formData.availability_status} onValueChange={(value) => setFormData({ ...formData, availability_status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_address">Location Address</Label>
                <Input
                  id="location_address"
                  value={formData.location_address}
                  onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner_name">Owner Name</Label>
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner_phone">Owner Phone</Label>
                  <Input
                    id="owner_phone"
                    value={formData.owner_phone}
                    onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCar ? "Update" : "Add"} Car
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Cars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Cars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Currently Rented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.rented}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeBookings}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cars" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cars">Rental Cars</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="cars" className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search by brand, model, or plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Price/Hour</TableHead>
                  <TableHead>Price/Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCars.map((car) => {
                  const images = carImages[car.id] || [];
                  const primaryImage = images.find(img => img.is_primary) || images[0];
                  return (
                    <TableRow key={car.id}>
                      <TableCell>
                        {primaryImage ? (
                          <img 
                            src={primaryImage.image_url} 
                            alt={`${car.brand} ${car.model}`}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                            <Car className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{car.brand} {car.model}</div>
                          <div className="text-sm text-muted-foreground">{car.plate_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>{car.car_type}</TableCell>
                      <TableCell>{car.year}</TableCell>
                      <TableCell>{car.seating_capacity}</TableCell>
                      <TableCell>${car.price_per_hour}</TableCell>
                      <TableCell>${car.price_per_day}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            car.availability_status === "available"
                              ? "default"
                              : car.availability_status === "rented"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {car.availability_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={car.is_active ? "default" : "outline"}>
                          {car.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenImagesDialog(car)} title="Manage Images">
                            <ImageIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(car)} title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingCarId(car.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <div className="flex gap-4">
            <Select value={bookingFilter} onValueChange={setBookingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="px-3 py-1">
              {stats.pendingBookings} pending
            </Badge>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRentals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRentals.map((rental) => {
                    const car = cars.find(c => c.id === rental.car_id);
                    return (
                      <TableRow key={rental.id}>
                        <TableCell className="font-mono text-sm">{rental.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          {car ? `${car.brand} ${car.model}` : "Unknown"}
                        </TableCell>
                        <TableCell>
                          {rental.duration_value} {rental.duration_type}
                        </TableCell>
                        <TableCell>{new Date(rental.rental_start).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(rental.rental_end).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">${rental.total_price}</TableCell>
                        <TableCell className="text-sm">{rental.contact_phone}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              rental.status === "active" || rental.status === "confirmed"
                                ? "default"
                                : rental.status === "completed"
                                ? "secondary"
                                : rental.status === "pending"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {rental.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(rental);
                                setIsBookingDetailsOpen(true);
                              }}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {rental.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateBookingStatus(rental.id, "confirmed")}
                                  title="Confirm"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateBookingStatus(rental.id, "cancelled")}
                                  title="Cancel"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {rental.status === "confirmed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateBookingStatus(rental.id, "active")}
                                title="Mark Active"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {rental.status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateBookingStatus(rental.id, "completed")}
                                title="Mark Completed"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Management Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={(open) => {
        setIsImageDialogOpen(open);
        if (!open) {
          setSelectedCarForImages(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Images - {selectedCarForImages?.brand} {selectedCarForImages?.model}
            </DialogTitle>
            <DialogDescription>
              Upload and manage images for this rental car
            </DialogDescription>
          </DialogHeader>
          {selectedCarForImages && (
            <RentalCarImageUpload
              carId={selectedCarForImages.id}
              images={carImages[selectedCarForImages.id] || []}
              onImagesUpdate={handleImagesUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={isBookingDetailsOpen} onOpenChange={(open) => {
        setIsBookingDetailsOpen(open);
        if (!open) setSelectedBooking(null);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Booking Details
            </DialogTitle>
            <DialogDescription>
              Booking ID: {selectedBooking?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (() => {
            const car = cars.find(c => c.id === selectedBooking.car_id);
            return (
              <div className="space-y-4">
                {/* Car Info */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Vehicle</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {car ? `${car.brand} ${car.model} (${car.year})` : "Unknown Vehicle"}
                  </p>
                  {car?.plate_number && (
                    <p className="text-sm text-muted-foreground">Plate: {car.plate_number}</p>
                  )}
                </div>

                <Separator />

                {/* Customer Info */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedBooking.contact_phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedBooking.driver_license_number || "Not provided"}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rental Period */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Rental Period
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start</p>
                      <p className="font-medium">{new Date(selectedBooking.rental_start).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End</p>
                      <p className="font-medium">{new Date(selectedBooking.rental_end).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">Duration</span>
                    <span className="font-medium">{selectedBooking.duration_value} {selectedBooking.duration_type}</span>
                  </div>
                </div>

                <Separator />

                {/* Locations */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Locations
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Pickup</p>
                      <p>{selectedBooking.pickup_location || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Return</p>
                      <p>{selectedBooking.return_location || "Same as pickup"}</p>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.special_requests && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Special Requests
                      </h4>
                      <p className="text-sm p-3 rounded-lg bg-muted/50">
                        {selectedBooking.special_requests}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Pricing & Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Price</p>
                    <p className="text-2xl font-bold">${selectedBooking.total_price}</p>
                  </div>
                  <Badge
                    variant={
                      selectedBooking.status === "active" || selectedBooking.status === "confirmed"
                        ? "default"
                        : selectedBooking.status === "completed"
                        ? "secondary"
                        : selectedBooking.status === "pending"
                        ? "outline"
                        : "destructive"
                    }
                    className="text-sm px-3 py-1"
                  >
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCarId} onOpenChange={() => setDeletingCarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this rental car. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}