import { useState, useEffect } from "react";
import { Shield, Users, Car, DollarSign, CheckCircle, BarChart3, Tag, MessageSquare, Home, Activity, Settings, Banknote, FileText, CarFront, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string | null;
}

export function AdminSidebar({ activeTab, setActiveTab, userRole }: AdminSidebarProps) {
  const { open } = useSidebar();
  const { t } = useTranslation();
  const [pendingVerifications, setPendingVerifications] = useState(0);

  // Fetch pending verification count
  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from('driver_verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (!error && count !== null) {
        setPendingVerifications(count);
      }
    };

    fetchPendingCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('verification-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_verification_requests'
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const menuItems = [
    { id: "overview", label: t('admin.overview'), icon: Home, requiredRole: ["super_admin", "admin", "support"], badge: null },
    { id: "users", label: t('admin.userManagement'), icon: Users, requiredRole: ["super_admin", "admin"], badge: null },
    { id: "rides", label: t('admin.rideManagement'), icon: Car, requiredRole: ["super_admin", "admin", "support"], badge: null },
    { id: "rental-cars", label: t('admin.rentalCars'), icon: CarFront, requiredRole: ["super_admin", "admin"], badge: null },
    { id: "vehicles", label: t('admin.vehicles') || "Vehicles", icon: Truck, requiredRole: ["super_admin", "admin"], badge: null },
    { id: "pricing", label: t('admin.pricing'), icon: DollarSign, requiredRole: ["super_admin", "admin"], badge: null },
    { id: "verification", label: t('admin.driverVerification'), icon: CheckCircle, requiredRole: ["super_admin", "admin"], badge: pendingVerifications > 0 ? pendingVerifications : null },
    { id: "analytics", label: t('admin.analytics'), icon: BarChart3, requiredRole: ["super_admin", "admin"], badge: null },
    { id: "promos", label: t('admin.promoCodes'), icon: Tag, requiredRole: ["super_admin", "admin"], badge: null },
    { id: "support", label: t('admin.support'), icon: MessageSquare, requiredRole: ["super_admin", "admin", "support"], badge: null },
    { id: "activity", label: t('admin.activity'), icon: Activity, requiredRole: ["super_admin", "admin"], badge: null },
    { id: "financial", label: t('admin.financial'), icon: Banknote, requiredRole: ["super_admin", "admin"], badge: null },
    { id: "content", label: t('admin.content'), icon: FileText, requiredRole: ["super_admin", "admin", "support"], badge: null },
    { id: "system", label: t('admin.systemSettings'), icon: Settings, requiredRole: ["super_admin"], badge: null },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    userRole && item.requiredRole.includes(userRole)
  );

  return (
    <Sidebar 
      className={`${open ? "w-64" : "w-14"} transition-all duration-300`}
      collapsible="icon"
    >
      <div className="p-3 sm:p-4 border-b border-border/20">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          {open && (
            <div className="min-w-0">
              <h2 className="font-bold text-foreground truncate">{t('admin.title')}</h2>
              <p className="text-xs text-muted-foreground capitalize truncate">{userRole?.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      </div>
      
      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2">{t('admin.title')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveTab(item.id)}
                    isActive={activeTab === item.id}
                    className="w-full justify-start min-h-[44px] touch-manipulation"
                    tooltip={!open ? item.label : undefined}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {open && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge !== null && (
                          <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    )}
                    {!open && item.badge !== null && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}