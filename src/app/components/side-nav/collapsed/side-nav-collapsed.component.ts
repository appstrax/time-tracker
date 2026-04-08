import { Component, EventEmitter, Output, computed } from '@angular/core';
import { RouterModule } from '@angular/router';

import { UserRole } from '@models';
import { Store } from '@state';

@Component({
  selector: 'app-side-nav-collapsed',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './side-nav-collapsed.component.html',
  styleUrls: ['./side-nav-collapsed.component.scss'],
})
export class SideNavCollapsedComponent {
  @Output() logout = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<void>();

  user = computed(() => this.store.user.user());
  admin = computed(() => this.user()?.role === UserRole.ADMIN);

  constructor(private store: Store) {}
}
