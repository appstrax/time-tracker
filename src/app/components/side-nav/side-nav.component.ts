import { Component, AfterViewInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Tooltip } from 'bootstrap';
import { appstraxAuth } from '@appstrax/services/auth';

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
  imports: [CommonModule, RouterModule]
})
export class SideNavComponent implements AfterViewInit, OnDestroy {
  isVisible = false;
  private closeTimeout: any;
  private readonly THRESHOLD = 50;
  private readonly BUFFER_ZONE = 100;
  private tooltips: Tooltip[] = [];

  constructor(private router: Router) {}

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    // Clear any existing timeout
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }

    // If mouse is in the threshold zone, show the nav
    if (event.clientX <= this.THRESHOLD) {
      this.isVisible = true;
      return;
    }

    // If mouse is in the buffer zone, keep the nav open
    if (event.clientX <= this.BUFFER_ZONE && this.isVisible) {
      return;
    }

    // If mouse is outside buffer zone and nav is open, set timeout to close
    if (event.clientX > this.BUFFER_ZONE && this.isVisible) {
      this.closeTimeout = setTimeout(() => {
        this.isVisible = false;
        // Hide all tooltips when nav closes
        this.hideAllTooltips();
      }, 500); // 500ms delay before closing
    }
  }

  navItems: NavItem[] = [
    { title: 'Define', icon: 'bi bi-pencil-square', route: '/define' },
    { title: 'Tickets', icon: 'bi bi-ticket-perforated', route: '/tickets' },
    { title: 'Repos', icon: 'bi bi-code-square', route: '/repos' },
    { title: 'Billing', icon: 'bi bi-credit-card', route: '/billing' },
    { title: 'User Management', icon: 'bi bi-people', route: '/users' },
    { title: 'Documentation', icon: 'bi bi-file-text', route: '/docs' },
    { title: 'Compliance', icon: 'bi bi-shield-check', route: '/compliance' },
    { title: 'Dev-Ops', icon: 'bi bi-gear', route: '/devops' },
    { title: 'Guard Rails', icon: 'bi bi-shield-lock', route: '/guardrails' },
    { title: 'Quality', icon: 'bi bi-check-circle', route: '/quality' },
    { title: 'Audit Trails', icon: 'bi bi-clock-history', route: '/audit' },
    { title: 'Project State', icon: 'bi bi-kanban', route: '/project' },
    { title: 'Stats', icon: 'bi bi-graph-up', route: '/stats' }
  ];

  ngAfterViewInit() {
    // Initialize tooltips with proper configuration
    setTimeout(() => {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      this.tooltips = [...tooltipTriggerList].map(tooltipTriggerEl => {
        return new Tooltip(tooltipTriggerEl, {
          placement: 'right',
          trigger: 'hover',
          delay: { show: 300, hide: 100 }
        });
      });
    }, 100);
  }

  ngOnDestroy() {
    // Clean up tooltips
    this.tooltips.forEach(tooltip => tooltip.dispose());
  }

  private hideAllTooltips() {
    this.tooltips.forEach(tooltip => tooltip.hide());
  }

  async logout() {
    try {
      await appstraxAuth.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to login page
      this.router.navigate(['/login']);
    }
  }

  toggleNav() {
    this.isVisible = !this.isVisible;
    if (!this.isVisible) {
      this.hideAllTooltips();
    }
  }
}
