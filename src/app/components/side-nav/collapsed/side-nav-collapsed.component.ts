import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  computed,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { Tooltip } from 'bootstrap';

import { UserRole } from '@models';
import { Store } from '@state';
import { getProfileLinkLabel } from '@utils';
import { UserAvatarComponent } from '../../user-avatar/user-avatar.component';

@Component({
  selector: 'app-side-nav-collapsed',
  standalone: true,
  imports: [RouterModule, UserAvatarComponent],
  templateUrl: './side-nav-collapsed.component.html',
  styleUrls: ['./side-nav-collapsed.component.scss'],
})
export class SideNavCollapsedComponent implements AfterViewInit, OnDestroy {
  @Output() logout = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<void>();

  user = computed(() => this.store.user.user());
  admin = computed(() => this.user()?.role === UserRole.ADMIN);
  profileAriaLabel = computed(() => getProfileLinkLabel(this.user()));

  private tooltips: Tooltip[] = [];

  constructor(
    private store: Store,
    private elementRef: ElementRef<HTMLElement>,
  ) {}

  ngAfterViewInit(): void {
    const triggers = this.elementRef.nativeElement.querySelectorAll<HTMLElement>(
      '[data-bs-toggle="tooltip"]',
    );

    this.tooltips = [...triggers].map(
      (el) =>
        new Tooltip(el, {
          placement: 'right',
          trigger: 'hover',
          delay: { show: 300, hide: 100 },
          container: 'body',
          title: () => el.getAttribute('data-bs-title') || '',
        }),
    );
  }

  ngOnDestroy(): void {
    this.tooltips.forEach((tooltip) => tooltip.dispose());
  }

  hideAllTooltips(): void {
    this.tooltips.forEach((tooltip) => tooltip.hide());
  }
}
