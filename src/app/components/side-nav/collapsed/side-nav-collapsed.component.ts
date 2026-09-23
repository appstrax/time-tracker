import {
  Component,
  EventEmitter,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { UserRole } from '@models';
import { Store } from '@state';
import { SideNavProfileCardComponent } from '../side-nav-profile-card/side-nav-profile-card.component';

@Component({
  selector: 'app-side-nav-collapsed',
  standalone: true,
  imports: [RouterModule, NgbTooltipModule, SideNavProfileCardComponent],
  templateUrl: './side-nav-collapsed.component.html',
  styleUrls: ['./side-nav-collapsed.component.scss'],
})
export class SideNavCollapsedComponent {
  @Output() logout = new EventEmitter<void>();

  @ViewChildren(NgbTooltip)
  private tooltipRefs?: QueryList<NgbTooltip>;

  @ViewChild(SideNavProfileCardComponent)
  private profileCard?: SideNavProfileCardComponent;

  admin = computed(() => this.store.user.user()?.role === UserRole.ADMIN);

  constructor(private store: Store) {}

  hideAllTooltips(): void {
    this.tooltipRefs?.forEach((tooltip) => tooltip.close());
    this.profileCard?.closeTooltips();
  }
}
