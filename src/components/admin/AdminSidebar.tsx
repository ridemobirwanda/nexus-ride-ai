import { Shield, Users, Car, DollarSign, CheckCircle, BarChart3, Tag, MessageSquare, Home } from "lucide-react";
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

const menuItems = [
  { id: "overview", label: "Overview", icon: Home, requiredRole: ["super_admin", "admin", "support"] },
  { id: "users", label: "User Management", icon: Users, requiredRole: ["super_admin", "admin"] },
  { id: "rides", label: "Ride Management", icon: Car, requiredRole: ["super_admin", "admin", "support"] },
  { id: "pricing", label: "Pricing & Surge", icon: DollarSign, requiredRole: ["super_admin", "admin"] },
  { id: "verification", label: "Driver Verification", icon: CheckCircle, requiredRole: ["super_admin", "admin"] },
  { id: "analytics", label: "Reports & Analytics", icon: BarChart3, requiredRole: ["super_admin", "admin"] },
  { id: "promos", label: "Promo Codes", icon: Tag, requiredRole: ["super_admin", "admin"] },
  { id: "support", label: "Support Center", icon: MessageSquare, requiredRole: ["super_admin", "admin", "support"] },
];

export function AdminSidebar({ activeTab, setActiveTab, userRole }: AdminSidebarProps) {
  const { open } = useSidebar();

  const filteredMenuItems = menuItems.filter(item => 
    userRole && item.requiredRole.includes(userRole)
  );

  return (
    <Sidebar className={open ? "w-64" : "w-14"}>
      <div className="p-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          {open && (
            <div>
              <h2 className="font-bold text-foreground">Admin Panel</h2>
              <p className="text-xs text-muted-foreground capitalize">{userRole?.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveTab(item.id)}
                    isActive={activeTab === item.id}
                    className="w-full justify-start"
                  >
                    <item.icon className="w-4 h-4" />
                    {open && <span>{item.label}</span>}
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