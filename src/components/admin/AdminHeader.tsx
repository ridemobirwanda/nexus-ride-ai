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
import { Bell, LogOut, Settings, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface AdminHeaderProps {
  userRole: string | null;
}

export function AdminHeader({ userRole }: AdminHeaderProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

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
    <header className="h-14 border-b border-border/20 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground">{t('admin.title')}</h1>
          <Badge variant={getRoleBadgeVariant(userRole)} className="capitalize">
            {userRole?.replace('_', ' ')}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden md:inline">{t('common.view')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('admin.title')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                {t('settings.title')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} disabled={loading} className="text-destructive">
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