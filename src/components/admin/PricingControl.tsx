import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Edit, Trash2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PricingControlProps {
  userRole: string | null;
}

interface SurgeArea {
  id: string;
  area_name: string;
  multiplier: number;
  is_active: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export function PricingControl({ userRole }: PricingControlProps) {
  const [surgeAreas, setSurgeAreas] = useState<SurgeArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<SurgeArea | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    area_name: "",
    multiplier: 1.0,
    reason: "",
    is_active: false,
  });

  useEffect(() => {
    fetchSurgeAreas();
  }, []);

  const fetchSurgeAreas = async () => {
    try {
      const { data, error } = await supabase
        .from("surge_pricing")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSurgeAreas(data || []);
    } catch (error) {
      console.error("Error fetching surge areas:", error);
      toast({
        title: "Error",
        description: "Failed to fetch surge pricing data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const surgeData = {
        area_name: formData.area_name,
        area_boundaries: { type: "Polygon", coordinates: [] }, // Placeholder
        multiplier: formData.multiplier,
        is_active: formData.is_active,
        reason: formData.reason,
        start_time: formData.is_active ? new Date().toISOString() : null,
        end_time: null,
      };

      if (editingArea) {
        const { error } = await supabase
          .from("surge_pricing")
          .update(surgeData)
          .eq("id", editingArea.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Surge area updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("surge_pricing")
          .insert([surgeData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Surge area created successfully.",
        });
      }

      setDialogOpen(false);
      setEditingArea(null);
      setFormData({ area_name: "", multiplier: 1.0, reason: "", is_active: false });
      fetchSurgeAreas();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save surge area.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (area: SurgeArea) => {
    setEditingArea(area);
    setFormData({
      area_name: area.area_name,
      multiplier: area.multiplier,
      reason: area.reason || "",
      is_active: area.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (areaId: string) => {
    try {
      const { error } = await supabase
        .from("surge_pricing")
        .delete()
        .eq("id", areaId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Surge area deleted successfully.",
      });
      
      fetchSurgeAreas();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete surge area.",
        variant: "destructive",
      });
    }
  };

  const toggleSurgeStatus = async (area: SurgeArea) => {
    try {
      const { error } = await supabase
        .from("surge_pricing")
        .update({ 
          is_active: !area.is_active,
          start_time: !area.is_active ? new Date().toISOString() : null,
          end_time: area.is_active ? new Date().toISOString() : null,
        })
        .eq("id", area.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Surge pricing ${!area.is_active ? 'activated' : 'deactivated'}.`,
      });
      
      fetchSurgeAreas();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update surge status.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Pricing & Surge Control</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
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
        <h2 className="text-2xl font-bold">Pricing & Surge Control</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Surge Area
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingArea ? "Edit Surge Area" : "Create Surge Area"}
              </DialogTitle>
              <DialogDescription>
                Configure surge pricing for specific areas during high demand periods.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="area_name">Area Name</Label>
                <Input
                  id="area_name"
                  value={formData.area_name}
                  onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                  placeholder="Downtown, Airport, etc."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="multiplier">Surge Multiplier</Label>
                <Input
                  id="multiplier"
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={formData.multiplier}
                  onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="High demand, special event, etc."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Activate immediately</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingArea ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Surge Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {surgeAreas.filter(area => area.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Multiplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {surgeAreas.length > 0 
                ? (surgeAreas.reduce((sum, area) => sum + area.multiplier, 0) / surgeAreas.length).toFixed(1)
                : "1.0"
              }x
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surgeAreas.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Surge Pricing Areas</CardTitle>
          <CardDescription>
            Manage surge pricing multipliers for different areas and time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area Name</TableHead>
                <TableHead>Multiplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surgeAreas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell className="font-medium">{area.area_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1 text-orange-500" />
                      {area.multiplier}x
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={area.is_active ? "default" : "secondary"}>
                      {area.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{area.reason || "Not specified"}</TableCell>
                  <TableCell>{new Date(area.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSurgeStatus(area)}
                      >
                        <Switch checked={area.is_active} className="pointer-events-none" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(area)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(area.id)}
                        disabled={userRole !== 'super_admin'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}