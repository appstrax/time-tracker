import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'system' | 'custom';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly THEME_MODE_KEY = 'app.theme.mode';
  private static readonly THEME_CUSTOM_VARS_KEY = 'app.theme.custom.vars';
  private prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)');
  private systemListener?: (this: MediaQueryList, ev: MediaQueryListEvent) => any;

  private currentThemeSubject = new BehaviorSubject<ThemeMode>('light');
  currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    const storedMode = (localStorage.getItem(ThemeService.THEME_MODE_KEY) as ThemeMode) || 'light';
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
    const effectiveBase = mode === 'system' ? (this.prefersDark?.matches ? 'dark' : 'light') : mode;
    htmlEl.setAttribute('data-theme', effectiveBase === 'custom' ? 'light' : effectiveBase);

    // Manage system listener
    if (this.systemListener && this.prefersDark) {
      this.prefersDark.removeEventListener('change', this.systemListener);
      this.systemListener = undefined;
    }
    if (mode === 'system' && this.prefersDark) {
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
    const vars = mode === 'custom' && customVars ? customVars : this.getStoredCustomVars();
    styleEl.textContent = this.buildVarsCss(vars);

    this.currentThemeSubject.next(mode);
  }

  private buildVarsCss(vars: Record<string, string>): string {
    const entries = Object.entries(vars);
    if (!entries.length) return '';
    const body = entries.map(([k, v]) => `${k}: ${v};`).join(' ');
    return `:root { ${body} }`;
  }

  getStoredCustomVars(): Record<string, string> {
    try {
      const raw = localStorage.getItem(ThemeService.THEME_CUSTOM_VARS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}


