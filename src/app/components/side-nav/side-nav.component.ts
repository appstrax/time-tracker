import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { HostListener, AfterViewInit } from '@angular/core';

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
  imports: [CommonModule, RouterModule],
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

    if (event.clientX > this.BUFFER_ZONE && this.isVisible) {
      this.closeTimeout = setTimeout(() => {
        this.isVisible = false;
        this.hideAllTooltips();
      }, 500);
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
    { title: 'Stats', icon: 'bi bi-graph-up', route: '/stats' },
  ];

  ngAfterViewInit() {
    setTimeout(() => {
      const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
      );
      this.tooltips = [...tooltipTriggerList].map((tooltipTriggerEl) => {
        return new Tooltip(tooltipTriggerEl, {
          placement: 'right',
          trigger: 'hover focus',
          delay: { show: 300, hide: 100 },
          container: 'body',
          boundary: document.body as any,
        });
      });
    }, 100);
  }

  ngOnDestroy() {
    this.tooltips.forEach((tooltip) => tooltip.dispose());
  }

  private hideAllTooltips() {
    this.tooltips.forEach((tooltip) => tooltip.hide());
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
    this.isVisible = !this.isVisible;
    if (!this.isVisible) {
      this.hideAllTooltips();
    }
  }
}
