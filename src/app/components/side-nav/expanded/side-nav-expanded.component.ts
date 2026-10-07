import {
  Component,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { Store } from '@state';

import { SideNavProfileCardComponent } from '../side-nav-profile-card/side-nav-profile-card.component';

@Component({
  selector: 'app-side-nav-expanded',
  standalone: true,
  imports: [RouterModule, NgbTooltipModule, SideNavProfileCardComponent],
  templateUrl: './side-nav-expanded.component.html',
  styleUrls: ['./side-nav-expanded.component.scss'],
})
export class SideNavExpandedComponent {
  @Input() compact = false;
  @Output() logout = new EventEmitter<void>();

  @ViewChildren(NgbTooltip)
  private tooltipRefs?: QueryList<NgbTooltip>;

  @ViewChild(SideNavProfileCardComponent)
  private profileCard?: SideNavProfileCardComponent;

  admin = computed(() => this.store.access.platformAdmin());

  showLogTime = computed(() => !this.store.access.needsAnalyticsLanding());
  showAnalytics = computed(() => this.store.access.hasAnalyticsAccess());

  constructor(private store: Store) {}

  hideAllTooltips(): void {
    this.tooltipRefs?.forEach((tooltip) => tooltip.close());
    this.profileCard?.closeTooltips();
  }
}
