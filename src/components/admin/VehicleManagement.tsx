import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Car, Users, DollarSign, Search, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleManagementProps {
  userRole: string | null;
}

interface CarCategory {
  id: string;
  name: string;
  description: string | null;
  base_fare: number;
  base_price_per_km: number;
  minimum_fare: number;
  passenger_capacity: number;
  features: string[];
  image_url: string | null;
  is_active: boolean;
  surge_multiplier: number;
  created_at: string;
  updated_at: string;
}

const defaultFormData = {
  name: "",
  description: "",
  base_fare: 2500,
  base_price_per_km: 800,
  minimum_fare: 3000,
  passenger_capacity: 4,
  features: "",
  image_url: "",
  is_active: true,
  surge_multiplier: 1.0,
};

export function VehicleManagement({ userRole }: VehicleManagementProps) {
  const [categories, setCategories] = useState<CarCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CarCategory | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState(defaultFormData);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("car_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        features: Array.isArray(item.features) ? item.features.map(f => String(f)) : []
      }));
      setCategories(transformedData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch vehicle categories.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const featuresArray = formData.features
        .split(",")
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const categoryData = {
        name: formData.name,
        description: formData.description || null,
        base_fare: formData.base_fare,
        base_price_per_km: formData.base_price_per_km,
        minimum_fare: formData.minimum_fare,
        passenger_capacity: formData.passenger_capacity,
        features: featuresArray,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        surge_multiplier: formData.surge_multiplier,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("car_categories")
          .update(categoryData)
          .eq("id", editingCategory.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Vehicle category updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("car_categories")
          .insert([categoryData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Vehicle category created successfully.",
        });
      }

      setDialogOpen(false);
      setEditingCategory(null);
      setFormData(defaultFormData);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save vehicle category.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: CarCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      base_fare: category.base_fare,
      base_price_per_km: category.base_price_per_km,
      minimum_fare: category.minimum_fare,
      passenger_capacity: category.passenger_capacity,
      features: category.features.join(", "),
      image_url: category.image_url || "",
      is_active: category.is_active,
      surge_multiplier: category.surge_multiplier,
    });
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategoryId) return;
    
    try {
      const { error } = await supabase
        .from("car_categories")
        .delete()
        .eq("id", deletingCategoryId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Vehicle category deleted successfully.",
      });
      
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete vehicle category.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingCategoryId(null);
    }
  };

  const toggleActiveStatus = async (category: CarCategory) => {
    try {
      const { error } = await supabase
        .from("car_categories")
        .update({ is_active: !category.is_active })
        .eq("id", category.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Category ${!category.is_active ? 'activated' : 'deactivated'}.`,
      });
      
      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const addSampleCategories = async () => {
    const sampleCategories = [
      {
        name: "Economy - Sedan",
        description: "Affordable and fuel-efficient for daily rides",
        base_fare: 2000,
        base_price_per_km: 500,
        minimum_fare: 2500,
        passenger_capacity: 4,
        features: ["Air Conditioning", "4 Seats", "Fuel Efficient", "Clean & Safe"],
        is_active: true,
        surge_multiplier: 1.0,
      },
      {
        name: "Comfort - SUV",
        description: "Spacious SUV with extra comfort features",
        base_fare: 3500,
        base_price_per_km: 900,
        minimum_fare: 4500,
        passenger_capacity: 6,
        features: ["Premium AC", "6 Seats", "Extra Legroom", "USB Charging", "WiFi"],
        is_active: true,
        surge_multiplier: 1.0,
      },
      {
        name: "Premium - Executive",
        description: "Luxury sedan for business travelers",
        base_fare: 5000,
        base_price_per_km: 1500,
        minimum_fare: 7000,
        passenger_capacity: 4,
        features: ["Leather Seats", "Premium Sound", "Privacy Glass", "Refreshments", "Professional Driver"],
        is_active: true,
        surge_multiplier: 1.0,
      },
      {
        name: "Van - Group",
        description: "Large van for groups and events",
        base_fare: 4000,
        base_price_per_km: 700,
        minimum_fare: 5500,
        passenger_capacity: 10,
        features: ["Air Conditioning", "10 Seats", "Luggage Space", "Group Friendly"],
        is_active: true,
        surge_multiplier: 1.0,
      },
    ];

    try {
      const { error } = await supabase
        .from("car_categories")
        .insert(sampleCategories);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Sample categories added successfully.",
      });
      
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add sample categories.",
        variant: "destructive",
      });
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} RWF`;

  // Export categories to CSV
  const exportToCSV = () => {
    const headers = [
      "name",
      "description",
      "base_fare",
      "base_price_per_km",
      "minimum_fare",
      "passenger_capacity",
      "features",
      "image_url",
      "is_active",
      "surge_multiplier"
    ];

    const csvRows = [
      headers.join(","),
      ...categories.map(cat => [
        `"${cat.name.replace(/"/g, '""')}"`,
        `"${(cat.description || "").replace(/"/g, '""')}"`,
        cat.base_fare,
        cat.base_price_per_km,
        cat.minimum_fare,
        cat.passenger_capacity,
        `"${cat.features.join("; ")}"`,
        `"${(cat.image_url || "").replace(/"/g, '""')}"`,
        cat.is_active,
        cat.surge_multiplier
      ].join(","))
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vehicle_categories_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${categories.length} vehicle categories to CSV.`,
    });
  };

  // Import categories from CSV
  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error("CSV file must have headers and at least one data row");
        }

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
        const requiredHeaders = ["name", "base_fare", "base_price_per_km", "minimum_fare"];
        
        for (const required of requiredHeaders) {
          if (!headers.includes(required)) {
            throw new Error(`Missing required column: ${required}`);
          }
        }

        const importedCategories: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === 0) continue;

          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          const features = row.features
            ? row.features.split(";").map(f => f.trim()).filter(f => f.length > 0)
            : [];

          importedCategories.push({
            name: row.name || `Category ${i}`,
            description: row.description || null,
            base_fare: parseFloat(row.base_fare) || 2500,
            base_price_per_km: parseFloat(row.base_price_per_km) || 800,
            minimum_fare: parseFloat(row.minimum_fare) || 3000,
            passenger_capacity: parseInt(row.passenger_capacity) || 4,
            features,
            image_url: row.image_url || null,
            is_active: row.is_active?.toLowerCase() === "true" || row.is_active === "1",
            surge_multiplier: parseFloat(row.surge_multiplier) || 1.0,
          });
        }

        if (importedCategories.length === 0) {
          throw new Error("No valid categories found in CSV");
        }

        const { error } = await supabase
          .from("car_categories")
          .insert(importedCategories);

        if (error) throw error;

        toast({
          title: "Import Successful",
          description: `Imported ${importedCategories.length} vehicle categories.`,
        });

        fetchCategories();
      } catch (error: any) {
        toast({
          title: "Import Failed",
          description: error.message || "Failed to import CSV file.",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  // Download sample CSV template
  const downloadTemplate = () => {
    const template = `name,description,base_fare,base_price_per_km,minimum_fare,passenger_capacity,features,image_url,is_active,surge_multiplier
"Economy - Sedan","Affordable daily rides",2000,500,2500,4,"Air Conditioning; 4 Seats; Fuel Efficient","",true,1.0
"Premium - SUV","Spacious and comfortable",4000,1000,5000,6,"Premium AC; 6 Seats; Extra Legroom; WiFi","",true,1.0`;

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "vehicle_categories_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template with sample data downloaded.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Vehicle Management</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Vehicle Management</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadTemplate} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Template
          </Button>
          <Button variant="outline" onClick={exportToCSV} size="sm" disabled={categories.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <label>
            <Button variant="outline" size="sm" asChild>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </span>
            </Button>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
          <Button variant="outline" onClick={addSampleCategories} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Sample Data
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingCategory(null);
              setFormData(defaultFormData);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Vehicle Category" : "Add Vehicle Category"}
                </DialogTitle>
                <DialogDescription>
                  Configure vehicle category details, pricing, and features.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Category Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Economy - Sedan"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="passenger_capacity">Passenger Capacity *</Label>
                    <Input
                      id="passenger_capacity"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.passenger_capacity}
                      onChange={(e) => setFormData({ ...formData, passenger_capacity: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this vehicle category"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_fare">Base Fare (RWF) *</Label>
                    <Input
                      id="base_fare"
                      type="number"
                      min="0"
                      value={formData.base_fare}
                      onChange={(e) => setFormData({ ...formData, base_fare: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="base_price_per_km">Price per KM (RWF) *</Label>
                    <Input
                      id="base_price_per_km"
                      type="number"
                      min="0"
                      value={formData.base_price_per_km}
                      onChange={(e) => setFormData({ ...formData, base_price_per_km: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="minimum_fare">Minimum Fare (RWF) *</Label>
                    <Input
                      id="minimum_fare"
                      type="number"
                      min="0"
                      value={formData.minimum_fare}
                      onChange={(e) => setFormData({ ...formData, minimum_fare: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="features">Features (comma-separated)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="Air Conditioning, 4 Seats, WiFi, USB Charging"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="image_url">Image URL (optional)</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="/src/assets/car-image.jpg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="surge_multiplier">Surge Multiplier</Label>
                    <Input
                      id="surge_multiplier"
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      value={formData.surge_multiplier}
                      onChange={(e) => setFormData({ ...formData, surge_multiplier: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active (visible to passengers)</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCategory ? "Update Category" : "Create Category"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              Total Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Badge variant="default" className="h-4 w-4 p-0 flex items-center justify-center text-xs">✓</Badge>
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {categories.filter(c => c.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Max Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...categories.map(c => c.passenger_capacity), 0)} seats
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              Avg Base Fare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.length > 0 
                ? formatCurrency(Math.round(categories.reduce((sum, c) => sum + c.base_fare, 0) / categories.length))
                : "0 RWF"
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Categories</CardTitle>
          <CardDescription>
            Manage vehicle types, pricing, and availability for ride bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Base Fare</TableHead>
                <TableHead>Per KM</TableHead>
                <TableHead>Min Fare</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No categories match your search" : "No vehicle categories found. Add some to get started!"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {category.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {category.passenger_capacity}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(category.base_fare)}</TableCell>
                    <TableCell>{formatCurrency(category.base_price_per_km)}</TableCell>
                    <TableCell>{formatCurrency(category.minimum_fare)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {category.features.slice(0, 2).map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {category.features.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{category.features.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActiveStatus(category)}
                          title={category.is_active ? "Deactivate" : "Activate"}
                        >
                          <Switch checked={category.is_active} className="pointer-events-none" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingCategoryId(category.id);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={userRole !== 'super_admin'}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this vehicle category.
              Existing rides using this category may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
