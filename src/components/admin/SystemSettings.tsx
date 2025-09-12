import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Globe, Bell, Shield, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemSettingsProps {
  userRole: string | null;
}

interface AppSettings {
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  maxRideDistance: number;
  defaultRideFee: number;
  appVersion: string;
  supportEmail: string;
  emergencyContact: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  geoFencing: boolean;
  autoDispatch: boolean;
}

export function SystemSettings({ userRole }: SystemSettingsProps) {
  const [settings, setSettings] = useState<AppSettings>({
    maintenanceMode: false,
    allowNewRegistrations: true,
    maxRideDistance: 50,
    defaultRideFee: 2.5,
    appVersion: "1.0.0",
    supportEmail: "support@rideshare.com",
    emergencyContact: "+1-800-911-HELP",
    pushNotifications: true,
    emailNotifications: true,
    geoFencing: true,
    autoDispatch: true,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveSettings = async () => {
    if (userRole !== 'super_admin') {
      toast({
        title: "Access Denied",
        description: "Only super admins can modify system settings.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // In a real app, this would save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Updated",
        description: "System settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update system settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = userRole !== 'super_admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Manage global application settings and configurations
          </p>
        </div>
        <Badge variant={settings.maintenanceMode ? "destructive" : "default"}>
          {settings.maintenanceMode ? "Maintenance Mode" : "Operational"}
        </Badge>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Basic configuration for the ride-sharing platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appVersion">App Version</Label>
                  <Input
                    id="appVersion"
                    value={settings.appVersion}
                    onChange={(e) => setSettings(prev => ({ ...prev, appVersion: e.target.value }))}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDistance">Max Ride Distance (km)</Label>
                  <Input
                    id="maxDistance"
                    type="number"
                    value={settings.maxRideDistance}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxRideDistance: parseInt(e.target.value) }))}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultFee">Default Ride Fee ($)</Label>
                  <Input
                    id="defaultFee"
                    type="number"
                    step="0.1"
                    value={settings.defaultRideFee}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultRideFee: parseFloat(e.target.value) }))}
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Disable app access for maintenance
                    </p>
                  </div>
                  <Switch
                    id="maintenance"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="registrations">Allow New Registrations</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable new user sign-ups
                    </p>
                  </div>
                  <Switch
                    id="registrations"
                    checked={settings.allowNewRegistrations}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowNewRegistrations: checked }))}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure system-wide notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotifs">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send mobile push notifications
                  </p>
                </div>
                <Switch
                  id="pushNotifs"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pushNotifications: checked }))}
                  disabled={isReadOnly}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifs">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications to users
                  </p>
                </div>
                <Switch
                  id="emailNotifs"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Security and safety configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={settings.emergencyContact}
                  onChange={(e) => setSettings(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  disabled={isReadOnly}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="geoFencing">Geo-Fencing</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable location-based restrictions
                  </p>
                </div>
                <Switch
                  id="geoFencing"
                  checked={settings.geoFencing}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, geoFencing: checked }))}
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Advanced system settings and automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoDispatch">Auto-Dispatch</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign rides to nearest drivers
                  </p>
                </div>
                <Switch
                  id="autoDispatch"
                  checked={settings.autoDispatch}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoDispatch: checked }))}
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings} 
          disabled={loading || isReadOnly}
          className="w-32"
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}