import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, AfterViewInit, Output, OnChanges } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Tooltip } from 'bootstrap';

interface NavItem {
  title: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-side-nav-collapsed',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-nav-collapsed.component.html',
  styleUrls: ['./side-nav-collapsed.component.scss'],
})
export class SideNavCollapsedComponent implements AfterViewInit, OnDestroy {
  @Input() navItems: NavItem[] = [];
  @Output() logout = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<void>();

  private tooltips: Tooltip[] = [];
  orderedNavItems: NavItem[] = [];

  ngOnChanges(): void {
    this.orderedNavItems = this.computeOrderedItems(this.navItems);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
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

  private computeOrderedItems(items: NavItem[]): NavItem[] {
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

    const unmatched: NavItem[] = [];
    for (const it of items) {
      const def = groupDefs.find((g) => g.match(it.title));
      if (def) grouped[def.key].push(it);
      else unmatched.push(it);
    }

    const flattened: NavItem[] = [];
    for (const def of groupDefs) {
      flattened.push(...grouped[def.key]);
    }
    // Append any unmatched items to the end to avoid accidental drops
    flattened.push(...unmatched);
    return flattened;
  }
}


