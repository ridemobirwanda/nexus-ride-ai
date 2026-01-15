import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LocalizationSettings {
  countryCode: string;
  currency: string;
  locale: string;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  serviceAreaCountries: string[];
}

export interface SystemSettings extends LocalizationSettings {
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

const DEFAULT_SETTINGS: SystemSettings = {
  // Localization defaults
  countryCode: 'RW',
  currency: 'RWF',
  locale: 'en-RW',
  mapCenter: { lat: -1.9414, lng: 30.0588 },
  mapZoom: 15,
  serviceAreaCountries: ['RW'],
  // System defaults
  maintenanceMode: false,
  allowNewRegistrations: true,
  maxRideDistance: 50,
  defaultRideFee: 2.5,
  appVersion: '1.0.0',
  supportEmail: 'support@rideshare.com',
  emergencyContact: '+1-800-911-HELP',
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: true,
  geoFencing: true,
  twoFactorAuth: false,
  autoDispatch: true,
  autoDispatchTimeout: 30,
  driverMatchingRadius: 10,
  minDriverRating: 3.5,
};

// Singleton cache for settings
let cachedSettings: SystemSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(cachedSettings || DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(!cachedSettings);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Return cached if valid and not forcing refresh
    if (!forceRefresh && cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
      setSettings(cachedSettings);
      setIsLoading(false);
      return cachedSettings;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('system_settings')
        .select('key, value');

      if (fetchError) throw fetchError;

      const settingsMap = new Map(data?.map(s => [s.key, s.value]) || []);

      // Parse map center safely
      let mapCenter = DEFAULT_SETTINGS.mapCenter;
      const mapCenterValue = settingsMap.get('default_map_center');
      if (mapCenterValue && typeof mapCenterValue === 'object' && 'lat' in mapCenterValue && 'lng' in mapCenterValue) {
        mapCenter = mapCenterValue as { lat: number; lng: number };
      }

      // Parse service area countries safely
      let serviceAreaCountries = DEFAULT_SETTINGS.serviceAreaCountries;
      const countriesValue = settingsMap.get('service_area_countries');
      if (Array.isArray(countriesValue)) {
        serviceAreaCountries = countriesValue.map(c => String(c));
      }

      const parseString = (value: unknown, fallback: string): string => {
        if (typeof value === 'string') return value.replace(/^"|"$/g, '');
        return fallback;
      };

      const newSettings: SystemSettings = {
        // Localization
        countryCode: parseString(settingsMap.get('default_country_code'), DEFAULT_SETTINGS.countryCode),
        currency: parseString(settingsMap.get('default_currency'), DEFAULT_SETTINGS.currency),
        locale: parseString(settingsMap.get('default_locale'), DEFAULT_SETTINGS.locale),
        mapCenter,
        mapZoom: Number(settingsMap.get('default_map_zoom') || DEFAULT_SETTINGS.mapZoom),
        serviceAreaCountries,
        // System settings
        maintenanceMode: Boolean(settingsMap.get('maintenance_mode')),
        allowNewRegistrations: settingsMap.get('allow_new_registrations') !== false,
        maxRideDistance: Number(settingsMap.get('max_ride_distance') || DEFAULT_SETTINGS.maxRideDistance),
        defaultRideFee: Number(settingsMap.get('default_ride_fee') || DEFAULT_SETTINGS.defaultRideFee),
        appVersion: parseString(settingsMap.get('app_version'), DEFAULT_SETTINGS.appVersion),
        supportEmail: parseString(settingsMap.get('support_email'), DEFAULT_SETTINGS.supportEmail),
        emergencyContact: parseString(settingsMap.get('emergency_contact'), DEFAULT_SETTINGS.emergencyContact),
        pushNotifications: settingsMap.get('push_notifications') !== false,
        emailNotifications: settingsMap.get('email_notifications') !== false,
        smsNotifications: settingsMap.get('sms_notifications') !== false,
        geoFencing: settingsMap.get('geo_fencing') !== false,
        twoFactorAuth: Boolean(settingsMap.get('two_factor_auth')),
        autoDispatch: settingsMap.get('auto_dispatch') !== false,
        autoDispatchTimeout: Number(settingsMap.get('auto_dispatch_timeout') || DEFAULT_SETTINGS.autoDispatchTimeout),
        driverMatchingRadius: Number(settingsMap.get('driver_matching_radius') || DEFAULT_SETTINGS.driverMatchingRadius),
        minDriverRating: Number(settingsMap.get('min_driver_rating') || DEFAULT_SETTINGS.minDriverRating),
      };

      // Update cache
      cachedSettings = newSettings;
      cacheTimestamp = now;
      
      setSettings(newSettings);
      setError(null);
      return newSettings;
    } catch (err) {
      console.error('Failed to fetch system settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      return settings;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Currency formatter helper
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat(settings.locale, {
      style: 'currency',
      currency: settings.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  }, [settings.locale, settings.currency]);

  // Build Mapbox geocoding URL with dynamic country
  const buildGeocodingUrl = useCallback((
    query: string,
    token: string,
    options: { types?: string; limit?: number; proximity?: boolean } = {}
  ): string => {
    const { types = 'address,poi', limit = 5, proximity = true } = options;
    const countries = settings.serviceAreaCountries.join(',');
    const proximityParam = proximity 
      ? `&proximity=${settings.mapCenter.lng},${settings.mapCenter.lat}` 
      : '';
    
    return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=${countries}&types=${types}&limit=${limit}${proximityParam}`;
  }, [settings.serviceAreaCountries, settings.mapCenter]);

  // Build reverse geocoding URL
  const buildReverseGeocodingUrl = useCallback((
    lng: number,
    lat: number,
    token: string,
    types: string = 'address,poi'
  ): string => {
    const countries = settings.serviceAreaCountries.join(',');
    return `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&country=${countries}&types=${types}`;
  }, [settings.serviceAreaCountries]);

  return {
    settings,
    isLoading,
    error,
    refresh: () => fetchSettings(true),
    formatCurrency,
    buildGeocodingUrl,
    buildReverseGeocodingUrl,
  };
}

// Standalone function for edge functions/non-React contexts
export async function getSystemSettings(): Promise<SystemSettings> {
  if (cachedSettings && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return cachedSettings;
  }

  const { data } = await supabase
    .from('system_settings')
    .select('key, value');

  if (!data) return DEFAULT_SETTINGS;

  const settingsMap = new Map(data.map(s => [s.key, s.value]));
  
  let mapCenter = DEFAULT_SETTINGS.mapCenter;
  const mapCenterValue = settingsMap.get('default_map_center');
  if (mapCenterValue && typeof mapCenterValue === 'object' && 'lat' in mapCenterValue && 'lng' in mapCenterValue) {
    mapCenter = mapCenterValue as { lat: number; lng: number };
  }

  let serviceAreaCountries = DEFAULT_SETTINGS.serviceAreaCountries;
  const countriesValue = settingsMap.get('service_area_countries');
  if (Array.isArray(countriesValue)) {
    serviceAreaCountries = countriesValue.map(c => String(c));
  }

  const parseString = (value: unknown, fallback: string): string => {
    if (typeof value === 'string') return value.replace(/^"|"$/g, '');
    return fallback;
  };

  cachedSettings = {
    countryCode: parseString(settingsMap.get('default_country_code'), DEFAULT_SETTINGS.countryCode),
    currency: parseString(settingsMap.get('default_currency'), DEFAULT_SETTINGS.currency),
    locale: parseString(settingsMap.get('default_locale'), DEFAULT_SETTINGS.locale),
    mapCenter,
    mapZoom: Number(settingsMap.get('default_map_zoom') || DEFAULT_SETTINGS.mapZoom),
    serviceAreaCountries,
    maintenanceMode: Boolean(settingsMap.get('maintenance_mode')),
    allowNewRegistrations: settingsMap.get('allow_new_registrations') !== false,
    maxRideDistance: Number(settingsMap.get('max_ride_distance') || DEFAULT_SETTINGS.maxRideDistance),
    defaultRideFee: Number(settingsMap.get('default_ride_fee') || DEFAULT_SETTINGS.defaultRideFee),
    appVersion: parseString(settingsMap.get('app_version'), DEFAULT_SETTINGS.appVersion),
    supportEmail: parseString(settingsMap.get('support_email'), DEFAULT_SETTINGS.supportEmail),
    emergencyContact: parseString(settingsMap.get('emergency_contact'), DEFAULT_SETTINGS.emergencyContact),
    pushNotifications: settingsMap.get('push_notifications') !== false,
    emailNotifications: settingsMap.get('email_notifications') !== false,
    smsNotifications: settingsMap.get('sms_notifications') !== false,
    geoFencing: settingsMap.get('geo_fencing') !== false,
    twoFactorAuth: Boolean(settingsMap.get('two_factor_auth')),
    autoDispatch: settingsMap.get('auto_dispatch') !== false,
    autoDispatchTimeout: Number(settingsMap.get('auto_dispatch_timeout') || DEFAULT_SETTINGS.autoDispatchTimeout),
    driverMatchingRadius: Number(settingsMap.get('driver_matching_radius') || DEFAULT_SETTINGS.driverMatchingRadius),
    minDriverRating: Number(settingsMap.get('min_driver_rating') || DEFAULT_SETTINGS.minDriverRating),
  };
  cacheTimestamp = Date.now();

  return cachedSettings;
}
