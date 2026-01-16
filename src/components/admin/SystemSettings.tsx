import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Globe, Bell, Shield, Database, RefreshCw, MapPin, Car } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  // Localization settings
  countryCode: string;
  currency: string;
  locale: string;
  mapCenterLat: number;
  mapCenterLng: number;
  mapZoom: number;
  serviceAreaCountries: string;
}

const COUNTRY_OPTIONS = [
  { code: 'RW', name: 'Rwanda', currency: 'RWF', locale: 'rw-RW' },
  { code: 'KE', name: 'Kenya', currency: 'KES', locale: 'en-KE' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', locale: 'en-UG' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', locale: 'sw-TZ' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', locale: 'en-NG' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', locale: 'en-GH' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', locale: 'en-ZA' },
  { code: 'US', name: 'United States', currency: 'USD', locale: 'en-US' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', locale: 'en-GB' },
  { code: 'FR', name: 'France', currency: 'EUR', locale: 'fr-FR' },
];

const CURRENCY_OPTIONS = [
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
];

export function SystemSettings({ userRole }: SystemSettingsProps) {
  const { t } = useTranslation();
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
    // Localization defaults
    countryCode: 'RW',
    currency: 'RWF',
    locale: 'rw-RW',
    mapCenterLat: -1.9403,
    mapCenterLng: 30.0619,
    mapZoom: 13,
    serviceAreaCountries: 'RW',
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
      
      // Parse map center
      let mapCenterLat = -1.9403;
      let mapCenterLng = 30.0619;
      const mapCenterValue = settingsMap.get('default_map_center');
      if (mapCenterValue && typeof mapCenterValue === 'object' && 'lat' in mapCenterValue && 'lng' in mapCenterValue) {
        const mc = mapCenterValue as { lat: number; lng: number };
        mapCenterLat = mc.lat;
        mapCenterLng = mc.lng;
      }

      // Parse service area countries
      let serviceAreaCountries = 'RW';
      const countriesValue = settingsMap.get('service_area_countries');
      if (Array.isArray(countriesValue)) {
        serviceAreaCountries = countriesValue.join(',');
      } else if (typeof countriesValue === 'string') {
        serviceAreaCountries = countriesValue.replace(/"/g, '');
      }

      const parseString = (value: unknown, fallback: string): string => {
        if (typeof value === 'string') return value.replace(/^"|"$/g, '');
        return fallback;
      };

      setSettings({
        maintenanceMode: Boolean(settingsMap.get('maintenance_mode')),
        allowNewRegistrations: settingsMap.get('allow_new_registrations') !== false,
        maxRideDistance: Number(settingsMap.get('max_ride_distance') || 50),
        defaultRideFee: Number(settingsMap.get('default_ride_fee') || 2.5),
        appVersion: parseString(settingsMap.get('app_version'), "1.0.0"),
        supportEmail: parseString(settingsMap.get('support_email'), "support@rideshare.com"),
        emergencyContact: parseString(settingsMap.get('emergency_contact'), "+1-800-911-HELP"),
        pushNotifications: settingsMap.get('push_notifications') !== false,
        emailNotifications: settingsMap.get('email_notifications') !== false,
        smsNotifications: settingsMap.get('sms_notifications') !== false,
        geoFencing: settingsMap.get('geo_fencing') !== false,
        twoFactorAuth: Boolean(settingsMap.get('two_factor_auth')),
        autoDispatch: settingsMap.get('auto_dispatch') !== false,
        autoDispatchTimeout: Number(settingsMap.get('auto_dispatch_timeout') || 30),
        driverMatchingRadius: Number(settingsMap.get('driver_matching_radius') || 10),
        minDriverRating: Number(settingsMap.get('min_driver_rating') || 3.5),
        // Localization
        countryCode: parseString(settingsMap.get('default_country_code'), 'RW'),
        currency: parseString(settingsMap.get('default_currency'), 'RWF'),
        locale: parseString(settingsMap.get('default_locale'), 'rw-RW'),
        mapCenterLat,
        mapCenterLng,
        mapZoom: Number(settingsMap.get('default_map_zoom') || 13),
        serviceAreaCountries,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: t('errors.unknownError'),
        description: t('errors.loadFailed'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (userRole !== 'super_admin') {
      toast({
        title: t('errors.accessDenied'),
        description: t('errors.noPermission'),
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
        // Localization
        { key: 'default_country_code', value: settings.countryCode },
        { key: 'default_currency', value: settings.currency },
        { key: 'default_locale', value: settings.locale },
        { key: 'default_map_center', value: { lat: settings.mapCenterLat, lng: settings.mapCenterLng } },
        { key: 'default_map_zoom', value: settings.mapZoom },
        { key: 'service_area_countries', value: settings.serviceAreaCountries.split(',').map(c => c.trim()) },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: update.value, updated_at: new Date().toISOString() })
          .eq('key', update.key);

        if (error) throw error;
      }
      
      toast({
        title: t('settings.settingsUpdated'),
        description: t('settings.settingsSaved'),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: t('errors.unknownError'),
        description: t('errors.saveFailed'),
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
          <h1 className="text-3xl font-bold">{t('admin.systemSettings')}</h1>
          <p className="text-muted-foreground">
            {t('settings.title')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchSettings}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
          <Badge variant={settings.maintenanceMode ? "destructive" : "default"}>
            {settings.maintenanceMode ? t('admin.maintenanceMode') : t('admin.operational')}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('settings.general')}
          </TabsTrigger>
          <TabsTrigger value="localization" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Localization
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('settings.notifications')}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('settings.security')}
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {t('settings.system')}
          </TabsTrigger>
          <TabsTrigger value="dispatch" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
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

        <TabsContent value="localization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Region & Currency</CardTitle>
              <CardDescription>
                Configure the default country, currency, and locale for the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="countryCode">Default Country</Label>
                  <Select
                    value={settings.countryCode}
                    onValueChange={(value) => {
                      const country = COUNTRY_OPTIONS.find(c => c.code === value);
                      setSettings(prev => ({
                        ...prev,
                        countryCode: value,
                        currency: country?.currency || prev.currency,
                        locale: country?.locale || prev.locale,
                      }));
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name} ({country.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map(curr => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} - {curr.name} ({curr.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceAreaCountries">Service Area Countries</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Comma-separated country codes where the service operates (e.g., RW,KE,UG)
                </p>
                <Input
                  id="serviceAreaCountries"
                  value={settings.serviceAreaCountries}
                  onChange={(e) => setSettings(prev => ({ ...prev, serviceAreaCountries: e.target.value }))}
                  placeholder="RW,KE,UG"
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Map Configuration</CardTitle>
              <CardDescription>
                Set the default map center and zoom level for the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mapCenterLat">Center Latitude</Label>
                  <Input
                    id="mapCenterLat"
                    type="number"
                    step="0.0001"
                    value={settings.mapCenterLat}
                    onChange={(e) => setSettings(prev => ({ ...prev, mapCenterLat: parseFloat(e.target.value) }))}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mapCenterLng">Center Longitude</Label>
                  <Input
                    id="mapCenterLng"
                    type="number"
                    step="0.0001"
                    value={settings.mapCenterLng}
                    onChange={(e) => setSettings(prev => ({ ...prev, mapCenterLng: parseFloat(e.target.value) }))}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mapZoom">Default Zoom Level</Label>
                  <Input
                    id="mapZoom"
                    type="number"
                    min="1"
                    max="20"
                    value={settings.mapZoom}
                    onChange={(e) => setSettings(prev => ({ ...prev, mapZoom: parseInt(e.target.value) }))}
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Common City Centers</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Kigali', lat: -1.9403, lng: 30.0619 },
                    { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
                    { name: 'Kampala', lat: 0.3476, lng: 32.5825 },
                    { name: 'Dar es Salaam', lat: -6.7924, lng: 39.2083 },
                    { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
                  ].map(city => (
                    <Button
                      key={city.name}
                      variant="outline"
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        mapCenterLat: city.lat,
                        mapCenterLng: city.lng,
                      }))}
                      disabled={isReadOnly}
                    >
                      {city.name}
                    </Button>
                  ))}
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
          {t('settings.reset')}
        </Button>
        <Button 
          onClick={handleSaveSettings} 
          disabled={saving || isReadOnly}
          className="w-32"
        >
          {saving ? t('settings.saving') : t('settings.saveChanges')}
        </Button>
      </div>
    </div>
  );
}