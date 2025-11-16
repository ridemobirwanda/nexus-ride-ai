import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Globe, Bell, Shield, Database, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  smsNotifications: boolean;
  geoFencing: boolean;
  twoFactorAuth: boolean;
  autoDispatch: boolean;
  autoDispatchTimeout: number;
  driverMatchingRadius: number;
  minDriverRating: number;
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
    smsNotifications: true,
    geoFencing: true,
    twoFactorAuth: false,
    autoDispatch: true,
    autoDispatchTimeout: 30,
    driverMatchingRadius: 10,
    minDriverRating: 3.5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value');

      if (error) throw error;

      const settingsMap = new Map(data?.map(s => [s.key, s.value]) || []);
      
      setSettings({
        maintenanceMode: Boolean(settingsMap.get('maintenance_mode')),
        allowNewRegistrations: settingsMap.get('allow_new_registrations') !== false,
        maxRideDistance: Number(settingsMap.get('max_ride_distance') || 50),
        defaultRideFee: Number(settingsMap.get('default_ride_fee') || 2.5),
        appVersion: String(settingsMap.get('app_version') || "1.0.0").replace(/"/g, ''),
        supportEmail: String(settingsMap.get('support_email') || "support@rideshare.com").replace(/"/g, ''),
        emergencyContact: String(settingsMap.get('emergency_contact') || "+1-800-911-HELP").replace(/"/g, ''),
        pushNotifications: settingsMap.get('push_notifications') !== false,
        emailNotifications: settingsMap.get('email_notifications') !== false,
        smsNotifications: settingsMap.get('sms_notifications') !== false,
        geoFencing: settingsMap.get('geo_fencing') !== false,
        twoFactorAuth: Boolean(settingsMap.get('two_factor_auth')),
        autoDispatch: settingsMap.get('auto_dispatch') !== false,
        autoDispatchTimeout: Number(settingsMap.get('auto_dispatch_timeout') || 30),
        driverMatchingRadius: Number(settingsMap.get('driver_matching_radius') || 10),
        minDriverRating: Number(settingsMap.get('min_driver_rating') || 3.5),
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (userRole !== 'super_admin') {
      toast({
        title: "Access Denied",
        description: "Only super admins can modify system settings.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const updates = [
        { key: 'maintenance_mode', value: settings.maintenanceMode },
        { key: 'allow_new_registrations', value: settings.allowNewRegistrations },
        { key: 'max_ride_distance', value: settings.maxRideDistance },
        { key: 'default_ride_fee', value: settings.defaultRideFee },
        { key: 'app_version', value: settings.appVersion },
        { key: 'support_email', value: settings.supportEmail },
        { key: 'emergency_contact', value: settings.emergencyContact },
        { key: 'push_notifications', value: settings.pushNotifications },
        { key: 'email_notifications', value: settings.emailNotifications },
        { key: 'sms_notifications', value: settings.smsNotifications },
        { key: 'geo_fencing', value: settings.geoFencing },
        { key: 'two_factor_auth', value: settings.twoFactorAuth },
        { key: 'auto_dispatch', value: settings.autoDispatch },
        { key: 'auto_dispatch_timeout', value: settings.autoDispatchTimeout },
        { key: 'driver_matching_radius', value: settings.driverMatchingRadius },
        { key: 'min_driver_rating', value: settings.minDriverRating },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: update.value, updated_at: new Date().toISOString() })
          .eq('key', update.key);

        if (error) throw error;
      }
      
      toast({
        title: "Settings Updated",
        description: "System settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to update system settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isReadOnly = userRole !== 'super_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Manage global application settings and configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchSettings}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Badge variant={settings.maintenanceMode ? "destructive" : "default"}>
            {settings.maintenanceMode ? "Maintenance Mode" : "Operational"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="dispatch" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Auto-Dispatch
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

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for admin accounts
                  </p>
                </div>
                <Switch
                  id="twoFactorAuth"
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, twoFactorAuth: checked }))}
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
                Advanced system settings and database maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appVersion">App Version</Label>
                <Input
                  id="appVersion"
                  value={settings.appVersion}
                  onChange={(e) => setSettings(prev => ({ ...prev, appVersion: e.target.value }))}
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispatch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Dispatch Configuration</CardTitle>
              <CardDescription>
                Configure AI-powered automatic driver assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="autoDispatch" className="text-base">Enable Auto-Dispatch</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign rides to best matching drivers
                  </p>
                </div>
                <Switch
                  id="autoDispatch"
                  checked={settings.autoDispatch}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoDispatch: checked }))}
                  disabled={isReadOnly}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="autoDispatchTimeout">Auto-Dispatch Timeout (seconds)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Delay before auto-assigning a driver to a new ride
                  </p>
                  <Input
                    id="autoDispatchTimeout"
                    type="number"
                    min="5"
                    max="120"
                    value={settings.autoDispatchTimeout}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoDispatchTimeout: Number(e.target.value) }))}
                    disabled={isReadOnly || !settings.autoDispatch}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driverMatchingRadius">Driver Search Radius (km)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Maximum distance to search for available drivers
                  </p>
                  <Input
                    id="driverMatchingRadius"
                    type="number"
                    min="1"
                    max="50"
                    value={settings.driverMatchingRadius}
                    onChange={(e) => setSettings(prev => ({ ...prev, driverMatchingRadius: Number(e.target.value) }))}
                    disabled={isReadOnly || !settings.autoDispatch}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minDriverRating">Minimum Driver Rating</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Only match drivers with rating above this threshold
                  </p>
                  <Input
                    id="minDriverRating"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={settings.minDriverRating}
                    onChange={(e) => setSettings(prev => ({ ...prev, minDriverRating: Number(e.target.value) }))}
                    disabled={isReadOnly || !settings.autoDispatch}
                  />
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                <h4 className="font-semibold mb-2">AI Matching Algorithm</h4>
                <p className="text-sm text-muted-foreground">
                  The auto-dispatch system uses an AI-powered scoring algorithm that considers:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                  <li>Driver rating (40% weight) - Higher ratings preferred</li>
                  <li>Distance from pickup (35% weight) - Closer drivers preferred</li>
                  <li>Driver experience (15% weight) - More trips preferred</li>
                  <li>Estimated arrival time (10% weight) - Faster arrival preferred</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button 
          variant="outline"
          onClick={fetchSettings}
          disabled={saving}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button 
          onClick={handleSaveSettings} 
          disabled={saving || isReadOnly}
          className="w-32"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}