import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private static readonly AUTO_COLLAPSE_KEY = 'autoCollapseNav';
  private static readonly SIDENAV_MODE_KEY = 'sideNavMode';
  private autoCollapseSubject: BehaviorSubject<boolean>;

  constructor() {
    const stored = localStorage.getItem(SettingsService.AUTO_COLLAPSE_KEY);
    const initial = stored !== null ? stored === 'true' : false;
    this.autoCollapseSubject = new BehaviorSubject<boolean>(initial);
  }

  get autoCollapse$(): Observable<boolean> {
    return this.autoCollapseSubject.asObservable();
  }

  getAutoCollapse(): boolean {
    return this.autoCollapseSubject.getValue();
  }

  setAutoCollapse(enabled: boolean): void {
    localStorage.setItem(SettingsService.AUTO_COLLAPSE_KEY, String(enabled));
    this.autoCollapseSubject.next(enabled);
  }

  getSideNavMode(): 'collapsed' | 'expanded' {
    const value = localStorage.getItem(SettingsService.SIDENAV_MODE_KEY);
    return value === 'collapsed' ? 'collapsed' : 'expanded';
  }

  setSideNavMode(mode: 'collapsed' | 'expanded'): void {
    localStorage.setItem(SettingsService.SIDENAV_MODE_KEY, mode);
  }
}
