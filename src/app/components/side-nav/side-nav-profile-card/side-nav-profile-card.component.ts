import {
  Component,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
  computed,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  NgbDropdownModule,
  NgbTooltip,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';

import { Store } from '@state';
import {
  getProfileLinkLabel,
  getUserDisplayName,
  getUserSubtitle,
} from '@utils';

import { UserAvatarComponent } from '../../user-avatar/user-avatar.component';

@Component({
  selector: 'app-side-nav-profile-card',
  standalone: true,
  imports: [RouterModule, NgbDropdownModule, NgbTooltipModule, UserAvatarComponent],
  templateUrl: './side-nav-profile-card.component.html',
  styleUrl: './side-nav-profile-card.component.scss',
})
export class SideNavProfileCardComponent {
  @Input() compact = false;
  @Output() logout = new EventEmitter<void>();

  private readonly store = inject(Store);

  public readonly user = computed(() => this.store.user.user());
  public readonly userDisplayName = computed(() =>
    getUserDisplayName(this.user(), 'Profile'),
  );
  public readonly userSubtitle = computed(() => getUserSubtitle(this.user()));
  public readonly profileAriaLabel = computed(() =>
    getProfileLinkLabel(this.user()),
  );

  @ViewChildren(NgbTooltip)
  private tooltipRefs?: QueryList<NgbTooltip>;

  public closeTooltips(): void {
    this.tooltipRefs?.forEach((tooltip) => tooltip.close());
  }

  public onLogout(): void {
    this.logout.emit();
  }
}
