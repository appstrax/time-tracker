import { Component, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationStart } from '@angular/router';
import { HostListener, AfterViewInit } from '@angular/core';

import { Tooltip } from 'bootstrap';
import { appstraxAuth } from '@appstrax/services/auth';
import { SideNavCollapsedComponent } from './collapsed/side-nav-collapsed.component';
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
  imports: [RouterModule, SideNavCollapsedComponent, SideNavExpandedComponent],
})
export class SideNavComponent implements AfterViewInit, OnDestroy {
  isVisible = true;
  mode: 'collapsed' | 'expanded' = 'collapsed';
  private closeTimeout: any;
  private readonly THRESHOLD = 50;
  private readonly BUFFER_ZONE = 100;
  private tooltips: Tooltip[] = [];

  constructor(
    private router: Router,
    private settings: SettingsService,
    private store: Store,
  ) {
    this.mode = this.settings.getSideNavMode();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }

    if (event.clientX <= this.THRESHOLD) {
      this.isVisible = true;
      return;
    }

    if (event.clientX <= this.BUFFER_ZONE && this.isVisible) {
      return;
    }

    if (!this.settings.getAutoCollapse()) {
      this.isVisible = true;
      return;
    }

    if (event.clientX > this.BUFFER_ZONE && this.isVisible) {
      this.closeTimeout = setTimeout(() => {
        this.isVisible = false;
        this.hideAllTooltips();
      }, 1500);
    }
  }

  get isAdmin(): boolean {
    return this.store.user.user()?.role === UserRole.ADMIN;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]',
      );
      this.tooltips = [...tooltipTriggerList].map((tooltipTriggerEl) => {
        return new Tooltip(tooltipTriggerEl, {
          placement: 'right',
          trigger: 'hover',
          delay: { show: 300, hide: 100 },
          container: 'body',
          boundary: document.body as any,
        });
      });
    }, 100);

    // Hide tooltips on navigation to avoid lingering tooltips
    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationStart) {
        this.hideAllTooltips();
        // Also blur any focused element so focus-triggered tooltips cannot persist
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    });
  }

  ngOnDestroy() {
    this.tooltips.forEach((tooltip) => tooltip.dispose());
  }

  private hideAllTooltips() {
    this.tooltips.forEach((tooltip) => tooltip.hide());
  }

  @HostListener('document:click')
  onDocumentClick() {
    // Clicking anywhere should close any visible tooltip in collapsed mode
    this.hideAllTooltips();
  }

  async logout() {
    try {
      await appstraxAuth.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      this.router.navigate(['/login']);
    }
  }

  toggleNav() {
    // Expand/collapse mode toggle via double chevrons
    this.mode = this.mode === 'collapsed' ? 'expanded' : 'collapsed';
    this.settings.setSideNavMode(this.mode);
  }
}
