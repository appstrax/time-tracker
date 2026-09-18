import { Component, Input } from '@angular/core';

import { User } from '@models';
import { getUserInitials } from '@utils';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
})
export class UserAvatarComponent {
  @Input() user: User | null = null;
  @Input() sizePx = 32;
  @Input() fontSizePx = 12;

  get initials(): string {
    return getUserInitials(this.user);
  }
}
