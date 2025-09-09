import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { UserManagement } from "@/components/admin/UserManagement";
import { RideManagement } from "@/components/admin/RideManagement";
import { PricingControl } from "@/components/admin/PricingControl";
import { DriverVerification } from "@/components/admin/DriverVerification";
import { ReportsAnalytics } from "@/components/admin/ReportsAnalytics";
import { PromoCodeManager } from "@/components/admin/PromoCodeManager";
import { SupportCenter } from "@/components/admin/SupportCenter";
import { ActivityTracker } from "@/components/admin/ActivityTracker";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/admin/auth");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error || !roleData || !["super_admin", "admin", "support"].includes(roleData.role)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin panel.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setUserRole(roleData.role);
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/admin/auth");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview userRole={userRole} />;
      case "users":
        return <UserManagement userRole={userRole} />;
      case "rides":
        return <RideManagement userRole={userRole} />;
      case "pricing":
        return <PricingControl userRole={userRole} />;
      case "verification":
        return <DriverVerification userRole={userRole} />;
      case "analytics":
        return <ReportsAnalytics userRole={userRole} />;
      case "promos":
        return <PromoCodeManager userRole={userRole} />;
      case "support":
        return <SupportCenter userRole={userRole} />;
      case "activity":
        return <ActivityTracker userRole={userRole} />;
      default:
        return <AdminOverview userRole={userRole} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen rider-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full rider-bg">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
        <div className="flex-1 overflow-hidden">
          <AdminHeader userRole={userRole} />
          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;