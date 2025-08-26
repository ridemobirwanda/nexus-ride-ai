import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Edit, Trash2, Tag, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromoCodeManagerProps {
  userRole: string | null;
}

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_ride_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

export function PromoCodeManager({ userRole }: PromoCodeManagerProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 0,
    min_ride_amount: 0,
    max_discount: "",
    usage_limit: "",
    valid_until: "",
    is_active: true,
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch promo codes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      toast({
        title: "Error",
        description: "Promo code is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const promoData = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_ride_amount: formData.min_ride_amount,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active,
      };

      if (editingCode) {
        const { error } = await supabase
          .from("promo_codes")
          .update(promoData)
          .eq("id", editingCode.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Promo code updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("promo_codes")
          .insert([promoData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Promo code created successfully.",
        });
      }

      setDialogOpen(false);
      setEditingCode(null);
      setFormData({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: 0,
        min_ride_amount: 0,
        max_discount: "",
        usage_limit: "",
        valid_until: "",
        is_active: true,
      });
      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message?.includes("duplicate") 
          ? "Promo code already exists." 
          : "Failed to save promo code.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || "",
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      min_ride_amount: code.min_ride_amount,
      max_discount: code.max_discount?.toString() || "",
      usage_limit: code.usage_limit?.toString() || "",
      valid_until: code.valid_until ? code.valid_until.split('T')[0] : "",
      is_active: code.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", codeId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Promo code deleted successfully.",
      });
      
      fetchPromoCodes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete promo code.",
        variant: "destructive",
      });
    }
  };

  const toggleCodeStatus = async (code: PromoCode) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !code.is_active })
        .eq("id", code.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Promo code ${!code.is_active ? 'activated' : 'deactivated'}.`,
      });
      
      fetchPromoCodes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update promo code status.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `Promo code "${code}" copied to clipboard.`,
    });
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  const activeCount = promoCodes.filter(code => code.is_active && !isExpired(code.valid_until)).length;
  const totalUsage = promoCodes.reduce((sum, code) => sum + code.usage_count, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Promo Code Manager</h2>
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
        <h2 className="text-2xl font-bold">Promo Code Manager</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCode ? "Edit Promo Code" : "Create Promo Code"}
              </DialogTitle>
              <DialogDescription>
                Create discount codes to attract customers and boost sales.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Promo Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER2024"
                      required
                    />
                    <Button type="button" variant="outline" onClick={generateRandomCode}>
                      Generate
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summer promotion - 20% off all rides"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    Discount Value {formData.discount_type === 'percentage' ? '(%)' : '($)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.discount_type === 'percentage' ? "100" : undefined}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="min_ride_amount">Minimum Ride Amount ($)</Label>
                  <Input
                    id="min_ride_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_ride_amount}
                    onChange={(e) => setFormData({ ...formData, min_ride_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_discount">Max Discount ($) - Optional</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    placeholder="No limit"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Usage Limit - Optional</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until - Optional</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCode ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promoCodes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promoCodes.length > 0 ? Math.round(totalUsage / promoCodes.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promo Codes</CardTitle>
          <CardDescription>
            Manage discount codes and promotional offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{code.code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {code.discount_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {code.discount_type === 'percentage' 
                      ? `${code.discount_value}%` 
                      : `$${code.discount_value}`
                    }
                  </TableCell>
                  <TableCell>
                    {code.usage_count}
                    {code.usage_limit && ` / ${code.usage_limit}`}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        !code.is_active || isExpired(code.valid_until)
                          ? "secondary" 
                          : "default"
                      }
                    >
                      {!code.is_active 
                        ? "Inactive" 
                        : isExpired(code.valid_until) 
                        ? "Expired" 
                        : "Active"
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {code.valid_until 
                      ? new Date(code.valid_until).toLocaleDateString()
                      : "Never"
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCodeStatus(code)}
                      >
                        <Switch checked={code.is_active} className="pointer-events-none" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(code)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(code.id)}
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