import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private static readonly SIDENAV_MODE_KEY = 'sideNavMode';

  getSideNavMode(): 'collapsed' | 'expanded' {
    const value = localStorage.getItem(SettingsService.SIDENAV_MODE_KEY);
    return value === 'collapsed' ? 'collapsed' : 'expanded';
  }

  setSideNavMode(mode: 'collapsed' | 'expanded'): void {
    localStorage.setItem(SettingsService.SIDENAV_MODE_KEY, mode);
  }
}
