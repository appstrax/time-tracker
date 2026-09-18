import { Component, computed, EventEmitter, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

import { UserRole } from '@models';
import { Store } from '@state';
import { getUserDisplayName } from '@utils';
import { UserAvatarComponent } from '../../user-avatar/user-avatar.component';

@Component({
  selector: 'app-side-nav-expanded',
  standalone: true,
  imports: [RouterModule, UserAvatarComponent],
  templateUrl: './side-nav-expanded.component.html',
  styleUrls: ['./side-nav-expanded.component.scss'],
})
export class SideNavExpandedComponent {
  @Output() logout = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<void>();

  user = computed(() => this.store.user.user());
  admin = computed(() => this.user()?.role === UserRole.ADMIN);
  userDisplayName = computed(() => getUserDisplayName(this.user()));

  constructor(private store: Store) {}
}
