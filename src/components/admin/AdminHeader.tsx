import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings, User, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

interface AdminHeaderProps {
  userRole: string | null;
}

export function AdminHeader({ userRole }: AdminHeaderProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { toggleSidebar } = useSidebar();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: t('auth.signOut'),
        description: t('success.saved'),
      });
      navigate("/admin/auth");
    } catch (error) {
      toast({
        title: t('errors.unknownError'),
        description: t('errors.saveFailed'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      case "support":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <header className="h-12 sm:h-14 border-b border-border/20 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-2 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <SidebarTrigger className="min-h-[44px] min-w-[44px] touch-manipulation" />
          <h1 className="text-sm sm:text-xl font-semibold text-foreground truncate hidden sm:block">{t('admin.title')}</h1>
          <Badge variant={getRoleBadgeVariant(userRole)} className="capitalize hidden md:inline-flex text-xs">
            {userRole?.replace('_', ' ')}
          </Badge>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          
          <Button variant="ghost" size="sm" className="relative min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 touch-manipulation">
            <Bell className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="absolute top-2 right-2 sm:-top-1 sm:-right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 touch-manipulation">
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">{t('common.view')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('admin.title')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-[44px] sm:min-h-0">
                <Settings className="w-4 h-4 mr-2" />
                {t('settings.title')}
              </DropdownMenuItem>
              <div className="sm:hidden px-2 py-2">
                <LanguageSwitcher />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} disabled={loading} className="text-destructive min-h-[44px] sm:min-h-0">
                <LogOut className="w-4 h-4 mr-2" />
                {loading ? t('common.loading') : t('auth.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}