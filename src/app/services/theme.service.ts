import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly THEME_MODE_KEY = 'app.theme.mode';
  private prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)');
  private systemListener?: (this: MediaQueryList, ev: MediaQueryListEvent) => any;

  private currentThemeSubject = new BehaviorSubject<ThemeMode>('light');
  currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    const storedMode = (localStorage.getItem(ThemeService.THEME_MODE_KEY) as ThemeMode) || 'system';
    this.applyTheme(storedMode);
  }

  setTheme(mode: ThemeMode) {
    localStorage.setItem(ThemeService.THEME_MODE_KEY, mode);
    this.applyTheme(mode);
  }

  private applyTheme(mode: ThemeMode) {
    const htmlEl = document.documentElement;
    const effectiveBase = mode === 'system'
      ? (this.prefersDark?.matches ? 'dark' : 'light')
      : mode;
    htmlEl.setAttribute('data-theme', effectiveBase);

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

    this.currentThemeSubject.next(mode);
  }
}
