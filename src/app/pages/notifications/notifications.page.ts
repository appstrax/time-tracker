import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationsService, AppNotification, InviteItem } from '../../services/notifications.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class NotificationsPage {
  activeTab: 'all' | 'unread' | 'mentions' | 'system' | 'invites' = 'all';

  notifications: AppNotification[] = [];
  invites: InviteItem[] = [];

  constructor(private notificationsSvc: NotificationsService) {
    effect(() => {
      this.notifications = this.notificationsSvc.notifications();
      this.invites = this.notificationsSvc.invites();
    });
  }

  get visibleNotifications() {
    if (this.activeTab === 'unread') {
      return this.notifications.filter((n) => !n.read);
    }
    if (this.activeTab === 'mentions') {
      return this.notifications.filter((n) => n.category === 'mention');
    }
    if (this.activeTab === 'system') {
      return this.notifications.filter((n) => n.category === 'system');
    }
    return this.notifications;
  }

  get unreadCount(): number {
    return this.notificationsSvc.unreadCount();
  }

  setTab(tab: 'all' | 'unread' | 'mentions' | 'system' | 'invites') {
    this.activeTab = tab;
  }

  markAsRead(notificationId: number) {
    this.notificationsSvc.markAsRead(notificationId);
  }

  markAllAsRead() {
    this.notificationsSvc.markAllAsRead();
  }

  acceptInvite(inviteId: number) {
    this.notificationsSvc.acceptInvite(inviteId);
  }

  declineInvite(inviteId: number) {
    this.notificationsSvc.declineInvite(inviteId);
  }
}