import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'system' | 'custom';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly THEME_MODE_KEY = 'app.theme.mode';
  private static readonly THEME_CUSTOM_VARS_KEY = 'app.theme.custom.vars';
  private prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)');
  private systemListener?: (this: MediaQueryList, ev: MediaQueryListEvent) => any;
  // If true, 'system' mode mirrors OS preference; if false, we use branded dark
  private readonly useOsPreferenceForSystem = false;

  private currentThemeSubject = new BehaviorSubject<ThemeMode>('light');
  currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    const storedMode = (localStorage.getItem(ThemeService.THEME_MODE_KEY) as ThemeMode) || 'system';
    const storedVarsRaw = localStorage.getItem(ThemeService.THEME_CUSTOM_VARS_KEY);
    const customVars: Record<string, string> = storedVarsRaw ? JSON.parse(storedVarsRaw) : {};
    this.applyTheme(storedMode, customVars);
  }

  setTheme(mode: ThemeMode, customVars?: Record<string, string>) {
    localStorage.setItem(ThemeService.THEME_MODE_KEY, mode);
    if (mode === 'custom' && customVars) {
      localStorage.setItem(ThemeService.THEME_CUSTOM_VARS_KEY, JSON.stringify(customVars));
    }
    this.applyTheme(mode, customVars);
  }

  private applyTheme(mode: ThemeMode, customVars?: Record<string, string>) {
    const htmlEl = document.documentElement;
    const effectiveBase = mode === 'system'
      ? (this.useOsPreferenceForSystem ? (this.prefersDark?.matches ? 'dark' : 'light') : 'dark')
      : mode;
    htmlEl.setAttribute('data-theme', effectiveBase === 'custom' ? 'light' : effectiveBase);

    // Manage system listener
    if (this.systemListener && this.prefersDark) {
      this.prefersDark.removeEventListener('change', this.systemListener);
      this.systemListener = undefined;
    }
    if (mode === 'system' && this.prefersDark && this.useOsPreferenceForSystem) {
      this.systemListener = () => {
        const nowDark = this.prefersDark!.matches;
        htmlEl.setAttribute('data-theme', nowDark ? 'dark' : 'light');
      };
      this.prefersDark.addEventListener('change', this.systemListener);
    }

    // Apply custom variable overrides
    const styleId = 'theme-vars';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    let vars: Record<string, string> = {};
    let selector = ':root';
    if (mode === 'custom' && customVars) {
      vars = customVars;
    } else if (mode === 'system' && !this.useOsPreferenceForSystem) {
      // Branded dark: keep dark base tokens but override primary to gold palette
      vars = this.getBrandedSystemVars();
      selector = ':root[data-theme="dark"]';
    } else {
      // In light/dark (and system with OS preference), do not apply any custom overrides
      vars = {};
      selector = ':root';
    }
    styleEl.textContent = this.buildVarsCss(vars, selector);

    this.currentThemeSubject.next(mode);
  }

  private buildVarsCss(vars: Record<string, string>, selector = ':root'): string {
    const entries = Object.entries(vars);
    if (!entries.length) return '';
    const body = entries.map(([k, v]) => `${k}: ${v};`).join(' ');
    return `${selector} { ${body} }`;
  }

  getStoredCustomVars(): Record<string, string> {
    try {
      const raw = localStorage.getItem(ThemeService.THEME_CUSTOM_VARS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  clearCustomVars() {
    try {
      localStorage.removeItem(ThemeService.THEME_CUSTOM_VARS_KEY);
      const styleEl = document.getElementById('theme-vars') as HTMLStyleElement | null;
      if (styleEl) styleEl.textContent = '';
    } catch {}
  }

  private getBrandedSystemVars(): Record<string, string> {
    // Gold accents inspired by the brand logo; dark theme base remains from CSS tokens
    const goldPrimary = '#bfa25a';       // softer, less glaring gold
    const goldPrimaryDark = '#8e793b';   // muted dark gold for titles/accents
    const goldPrimaryLight = '#cbb072';  // subtle lighter shade
    return {
      '--color-primary': goldPrimary,
      '--color-primary-contrast': '#0f0f10',
      '--primary-color': goldPrimary,
      '--primary-color-dark': goldPrimaryDark,
      '--primary-color-light': `color-mix(in srgb, ${goldPrimary} 6%, transparent)`,
      '--bs-primary': goldPrimary,
    };
  }
}


