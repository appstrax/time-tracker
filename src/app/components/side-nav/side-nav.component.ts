import { Component, ViewChild } from '@angular/core';
import { RouterModule, Router, NavigationStart } from '@angular/router';
import { HostListener, AfterViewInit } from '@angular/core';

import { appstraxAuth } from '@appstrax/services/auth';
import { SideNavExpandedComponent } from './expanded/side-nav-expanded.component';
import { SettingsService } from '@services';
import { Store } from '@state';
import { UserRole } from '@models';

interface NavItem {
  title: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  standalone: true,
  imports: [RouterModule, SideNavExpandedComponent],
})
export class SideNavComponent implements AfterViewInit {
  mode: 'collapsed' | 'expanded' = 'collapsed';

  @ViewChild(SideNavExpandedComponent) navPanel?: SideNavExpandedComponent;

  constructor(
    private router: Router,
    private settings: SettingsService,
    private store: Store,
  ) {
    this.mode = this.settings.getSideNavMode();
  }

  get isAdmin(): boolean {
    return this.store.user.user()?.role === UserRole.ADMIN;
  }

  ngAfterViewInit() {
    // Hide tooltips on navigation to avoid lingering tooltips
    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationStart) {
        this.hideAllTooltips();
        // Also blur any focused element so focus-triggered tooltips cannot persist
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    });
  }

  private hideAllTooltips() {
    this.navPanel?.hideAllTooltips();
  }

  @HostListener('document:click')
  onDocumentClick() {
    // Clicking anywhere should close any visible tooltip in collapsed mode
    this.hideAllTooltips();
  }

  async logout() {
    try {
      await appstraxAuth.logout();
      this.store.access.clear();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      this.store.access.clear();
      this.router.navigate(['/login']);
    }
  }

  toggleNav() {
    // Expand/collapse mode toggle via double chevrons
    this.mode = this.mode === 'collapsed' ? 'expanded' : 'collapsed';
    this.settings.setSideNavMode(this.mode);
  }
}
