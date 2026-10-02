import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Global currency store.
 * - Base currency (all prices stored in DB) comes from admin `default_currency`.
 * - Admin controls which currencies visitors may see (`enabled_currencies`)
 *   and whether to auto-detect the visitor's local currency (`auto_convert_currency`).
 * - Live exchange rates from open.er-api.com, cached 1h in localStorage.
 */

export const ALL_CURRENCIES = [
  { code: 'RWF', name: 'Rwandan Franc' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'UGX', name: 'Ugandan Shilling' },
  { code: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'BIF', name: 'Burundian Franc' },
  { code: 'CDF', name: 'Congolese Franc' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'ETB', name: 'Ethiopian Birr' },
  { code: 'XOF', name: 'West African CFA' },
  { code: 'XAF', name: 'Central African CFA' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
];

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  RW: 'RWF', US: 'USD', GB: 'GBP', KE: 'KES', UG: 'UGX', TZ: 'TZS', BI: 'BIF', CD: 'CDF',
  NG: 'NGN', GH: 'GHS', ZA: 'ZAR', ET: 'ETB', AE: 'AED', CN: 'CNY', IN: 'INR', JP: 'JPY',
  CA: 'CAD', AU: 'AUD', CH: 'CHF', SN: 'XOF', CI: 'XOF', CM: 'XAF', GA: 'XAF',
  FR: 'EUR', DE: 'EUR', BE: 'EUR', NL: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR', IE: 'EUR',
  AT: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR',
};

interface State {
  base: string;
  enabled: string[];
  autoConvert: boolean;
  selected: string;
  detected: string | null;
  rates: Record<string, number>;
  ready: boolean;
}

const SELECTED_KEY = 'currency_selected';
const RATES_KEY = 'currency_rates_v1';

let state: State = {
  base: 'RWF',
  enabled: ['RWF'],
  autoConvert: false,
  selected: (typeof localStorage !== 'undefined' && localStorage.getItem(SELECTED_KEY)) || '',
  detected: null,
  rates: {},
  ready: false,
};
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const parseStr = (v: unknown, fb: string) => (typeof v === 'string' ? v.replace(/^"|"$/g, '') : fb);

async function loadRates(base: string) {
  try {
    const cached = JSON.parse(localStorage.getItem(RATES_KEY) || 'null');
    if (cached && cached.base === base && Date.now() - cached.at < 60 * 60 * 1000) {
      set({ rates: cached.rates });
      return;
    }
  } catch { /* ignore */ }
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    const json = await res.json();
    if (json?.result === 'success' && json.rates) {
      set({ rates: json.rates });
      localStorage.setItem(RATES_KEY, JSON.stringify({ base, at: Date.now(), rates: json.rates }));
    }
  } catch (e) {
    console.warn('Exchange rates unavailable, showing base currency', e);
  }
}

function guessCountryFromBrowser(): string | null {
  const langs = navigator.languages || [navigator.language];
  for (const l of langs) {
    const region = l.split('-')[1];
    if (region && region.length === 2) return region.toUpperCase();
  }
  return null;
}

async function detectCurrency(): Promise<string | null> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const j = await res.json();
    if (j?.currency) return String(j.currency);
    if (j?.country_code) return COUNTRY_TO_CURRENCY[j.country_code] || null;
  } catch { /* fall back */ }
  const c = guessCountryFromBrowser();
  return c ? COUNTRY_TO_CURRENCY[c] || null : null;
}

let initPromise: Promise<void> | null = null;
export function initCurrency(force = false) {
  if (initPromise && !force) return initPromise;
  initPromise = (async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['default_currency', 'enabled_currencies', 'auto_convert_currency']);
    const m = new Map((data || []).map((s) => [s.key, s.value]));
    const base = parseStr(m.get('default_currency'), 'RWF');
    const enabledRaw = m.get('enabled_currencies');
    const enabled = Array.from(new Set([base, ...(Array.isArray(enabledRaw) ? enabledRaw.map(String) : [])]));
    const autoConvert = m.get('auto_convert_currency') !== false && m.get('auto_convert_currency') !== undefined
      ? Boolean(m.get('auto_convert_currency'))
      : false;
    set({ base, enabled, autoConvert });

    await loadRates(base);

    let detected: string | null = null;
    if (autoConvert) detected = await detectCurrency();
    set({ detected, ready: true });
  })();
  return initPromise;
}

/** Currency actually shown to this visitor */
function resolveDisplay(s: State): string {
  const ok = (c: string | null | undefined) => !!c && s.enabled.includes(c) && (c === s.base || !!s.rates[c]);
  if (ok(s.selected)) return s.selected;
  if (s.autoConvert && ok(s.detected)) return s.detected!;
  return s.base;
}

export function useCurrency() {
  const s = useSyncExternalStore(subscribe, () => state, () => state);

  useEffect(() => {
    initCurrency();
  }, []);

  const display = resolveDisplay(s);

  const convert = useCallback(
    (amountInBase: number) => {
      if (display === s.base) return amountInBase;
      const r = s.rates[display];
      return r ? amountInBase * r : amountInBase;
    },
    [display, s.base, s.rates]
  );

  const format = useCallback(
    (amountInBase: number) => {
      const value = convert(Number(amountInBase) || 0);
      const decimals = Math.abs(value) < 100 && !['RWF', 'UGX', 'TZS', 'BIF', 'JPY', 'XOF', 'XAF', 'CDF'].includes(display) ? 2 : 0;
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: display,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
      } catch {
        return `${Math.round(value).toLocaleString()} ${display}`;
      }
    },
    [convert, display]
  );

  const setCurrency = useCallback((code: string) => {
    localStorage.setItem(SELECTED_KEY, code);
    set({ selected: code });
  }, []);

  return {
    base: s.base,
    display,
    enabled: s.enabled.filter((c) => c === s.base || s.rates[c]),
    detected: s.detected,
    autoConvert: s.autoConvert,
    ready: s.ready,
    convert,
    format,
    setCurrency,
    refresh: () => initCurrency(true),
  };
}
