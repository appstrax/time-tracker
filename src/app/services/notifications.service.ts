import { Injectable, computed, signal } from '@angular/core';

export type NotificationCategory = 'system' | 'mention' | 'general' | 'invite';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: NotificationCategory;
}

export interface InviteItem {
  id: number;
  type: 'project' | 'organization';
  name: string;
  inviter: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private notificationsSig = signal<AppNotification[]>([
    {
      id: 1,
      title: 'Build succeeded',
      message: 'Your latest CI run completed successfully.',
      timestamp: '2m ago',
      read: false,
      category: 'system',
    },
    {
      id: 2,
      title: 'You were mentioned',
      message: 'Alex mentioned you in Ticket #432.',
      timestamp: '1h ago',
      read: false,
      category: 'mention',
    },
    {
      id: 3,
      title: 'New release',
      message: 'v1.8.0 is now available.',
      timestamp: 'Yesterday',
      read: true,
      category: 'system',
    },
  ]);

  private invitesSig = signal<InviteItem[]>([
    {
      id: 201,
      type: 'project',
      name: 'Project Falcon',
      inviter: 'Alex Johnson',
      timestamp: '5m ago',
    },
    {
      id: 202,
      type: 'organization',
      name: 'Appstrax Labs',
      inviter: 'Cameron K',
      timestamp: 'Today',
    },
  ]);

  readonly notifications = computed(() => this.notificationsSig());
  readonly invites = computed(() => this.invitesSig());
  readonly unreadCount = computed(() => this.notificationsSig().filter((n) => !n.read).length);

  markAsRead(id: number) {
    this.notificationsSig.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  markAllAsRead() {
    this.notificationsSig.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  acceptInvite(inviteId: number) {
    this.invitesSig.update((list) => list.filter((i) => i.id !== inviteId));
  }

  declineInvite(inviteId: number) {
    this.invitesSig.update((list) => list.filter((i) => i.id !== inviteId));
  }
}


