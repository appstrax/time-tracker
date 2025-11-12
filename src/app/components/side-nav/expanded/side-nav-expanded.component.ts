import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

interface NavItem {
  title: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-side-nav-expanded',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-nav-expanded.component.html',
  styleUrls: ['./side-nav-expanded.component.scss'],
})
export class SideNavExpandedComponent implements OnInit, OnDestroy {
  @Input() navItems: NavItem[] = [];
  @Output() logout = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<void>();

  groups: { key: string; title: string; items: NavItem[] }[] = [];
  expandedState: Record<string, boolean> = {};
  private routeSub?: Subscription;
  private readonly organizationGroupKeys = new Set(['org', 'tools', 'ext']);

  constructor(private router: Router) {}

  ngOnInit() {
    this.setExpandedForCurrentRoute();
    this.routeSub = this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) {
        this.setExpandedForCurrentRoute();
      }
    });
  }

  ngOnChanges() {
    this.computeGroups();
  }

  ngOnDestroy() {
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  private computeGroups() {
    const groupDefs: { key: string; title: string; match: (title: string) => boolean }[] = [
      { key: 'plan', title: 'Plan & Design', match: (t) => ['Define', 'Design', 'DB Design', 'Documentation'].includes(t) },
      { key: 'dev', title: 'Development', match: (t) => ['Repos', 'Tickets', 'Code'].includes(t) },
      { key: 'qa', title: 'QA & Quality', match: (t) => ['Testing', 'Quality'].includes(t) },
      { key: 'ops', title: 'Delivery & Ops', match: (t) => ['Dev-Ops', 'Project State', 'Stats', 'Kpis'].includes(t) },
      { key: 'govsec', title: 'Security', match: (t) => ['Compliance', 'Guard Rails', 'Audit Trails'].includes(t) },
      { key: 'org', title: 'Organization', match: (t) => ['User Management', 'Billing'].includes(t) },
      { key: 'tools', title: 'Tools', match: (t) => ['Quotations'].includes(t) },
      { key: 'ext', title: 'Discover', match: (t) => ['Marketplace'].includes(t) },
    ];

    const grouped: Record<string, NavItem[]> = {};
    for (const def of groupDefs) grouped[def.key] = [];

    for (const item of this.navItems) {
      const def = groupDefs.find((g) => g.match(item.title));
      if (def) {
        grouped[def.key].push(item);
      }
    }

    this.groups = groupDefs
      .map((def) => ({ key: def.key, title: def.title, items: grouped[def.key] }))
      .filter((g) => g.items.length > 0);

    for (const g of this.groups) {
      if (this.expandedState[g.key] === undefined) this.expandedState[g.key] = false;
    }

    // Ensure the group matching the current route is expanded
    this.setExpandedForCurrentRoute();
  }

  toggleGroup(key: string) {
    const willOpen = !this.expandedState[key];
    if (willOpen) {
      for (const g of this.groups) this.expandedState[g.key] = false;
      this.expandedState[key] = true;
    } else {
      this.expandedState[key] = false;
    }
  }

  private setExpandedForCurrentRoute() {
    if (!this.groups.length) return;
    const url = this.router.url || '';
    const match = this.groups.find((g) => g.items.some((it) => url.startsWith(it.route)));
    if (match) {
      for (const g of this.groups) this.expandedState[g.key] = false;
      this.expandedState[match.key] = true;
    } else {
      // No match (e.g., settings, profile, contact) → collapse all groups
      for (const g of this.groups) this.expandedState[g.key] = false;
    }
  }

  isGroupActive(group: { key: string; title: string; items: { route: string }[] }): boolean {
    const url = this.router.url || '';
    return group.items.some((it) => url.startsWith(it.route));
  }

  get projectGroups() {
    return this.groups.filter((g) => !this.organizationGroupKeys.has(g.key));
  }

  get organizationGroups() {
    return this.groups.filter((g) => this.organizationGroupKeys.has(g.key));
  }
}


