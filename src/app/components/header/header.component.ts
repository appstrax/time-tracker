import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { effect } from '@angular/core';
import { NotificationsService } from '../../services/notifications.service';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { ProjectSelectorComponent } from '../project-selector/project-selector.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbsComponent,
    ProjectSelectorComponent,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  notificationCount = 0;

  constructor(private notifications: NotificationsService) {
    effect(() => {
      this.notificationCount = this.notifications.unreadCount();
    });
  }
}
