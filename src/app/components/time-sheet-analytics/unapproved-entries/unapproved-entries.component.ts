import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, ToastService, UsersService } from '@services';
import { TimeSheetDisplayUtil } from '@utils';
import { UnapprovedEntriesModalComponent } from '../../../modals/unapproved-entries/unapproved-entries.modal';

interface UnapprovedEntryGroup {
  date: Date;
  userId: string;
  totalHours: number;
  entries: TimeSheetEntry[];
}

@Component({
  selector: 'app-unapproved-entries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unapproved-entries.component.html',
  styleUrl: './unapproved-entries.component.scss',
})
export class UnapprovedEntriesComponent {
  public readonly timeSheetEntries = input<TimeSheetEntry[]>([]);
  public readonly canApprove = input(false);
  public readonly groupedEntries = computed(() => {
    const groupsMap = new Map<string, UnapprovedEntryGroup>();

    this.timeSheetEntries()
      .filter((entry) => !entry.approved)
      .forEach((entry) => {
        const entryDate = new Date(entry.date);
        const dateKey = entryDate.toISOString().split('T')[0];
        const groupKey = `${dateKey}_${entry.userId}`;

        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, {
            date: entryDate,
            userId: entry.userId,
            totalHours: 0,
            entries: [],
          });
        }

        const group = groupsMap.get(groupKey)!;
        group.entries.push(entry);
        group.totalHours += entry.hours;
      });

    return Array.from(groupsMap.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  });
  public readonly isLoading = signal(false);
  public readonly usersById = signal<Map<string, User>>(new Map());
  public readonly pendingUserIds = signal<Set<string>>(new Set());
  public readonly failedUserIds = signal<Set<string>>(new Set());

  private timeSheetEntryService = inject(TimeSheetEntryService);
  private usersService = inject(UsersService);
  private toastService = inject(ToastService);
  private modalService = inject(NgbModal);
  public displayUtils = inject(TimeSheetDisplayUtil);

  private userFetchGeneration = 0;
  private userLoadErrorToastShown = false;

  constructor() {
    effect(() => {
      const userIds = [...new Set(this.groupedEntries().map((g) => g.userId))];
      void this.loadUsers(userIds);
    });
  }

  public isUserNameLoading(userId: string): boolean {
    return (
      this.pendingUserIds().has(userId) && !this.usersById().has(userId)
    );
  }

  public getDisplayUserName(userId: string): string {
    return this.displayUtils.getUserName(
      userId,
      this.usersById().get(userId),
    );
  }

  private async loadUsers(userIds: string[]): Promise<void> {
    const missingUserIds = userIds.filter(
      (id) =>
        !this.usersById().has(id) &&
        !this.failedUserIds().has(id) &&
        !this.pendingUserIds().has(id),
    );
    if (!missingUserIds.length) return;

    this.addPendingUserIds(missingUserIds);
    const generation = ++this.userFetchGeneration;

    try {
      const users = await this.usersService.findByUserIds(missingUserIds);
      if (generation !== this.userFetchGeneration) {
        return;
      }

      const updated = new Map(this.usersById());
      users.forEach((user) => updated.set(user.id, user));
      this.usersById.set(updated);

      const returnedIds = new Set(users.map((user) => user.id));
      const unresolvedIds = missingUserIds.filter((id) => !returnedIds.has(id));
      if (unresolvedIds.length) {
        this.addFailedUserIds(unresolvedIds);
      }
    } catch {
      if (generation !== this.userFetchGeneration) {
        return;
      }
      this.addFailedUserIds(missingUserIds);
      if (!this.userLoadErrorToastShown) {
        this.userLoadErrorToastShown = true;
        this.toastService.error('Error loading user details');
      }
    } finally {
      if (generation === this.userFetchGeneration) {
        this.removePendingUserIds(missingUserIds);
      }
    }
  }

  private addPendingUserIds(userIds: string[]): void {
    const next = new Set(this.pendingUserIds());
    userIds.forEach((id) => next.add(id));
    this.pendingUserIds.set(next);
  }

  private removePendingUserIds(userIds: string[]): void {
    const next = new Set(this.pendingUserIds());
    userIds.forEach((id) => next.delete(id));
    this.pendingUserIds.set(next);
  }

  private addFailedUserIds(userIds: string[]): void {
    const next = new Set(this.failedUserIds());
    userIds.forEach((id) => next.add(id));
    this.failedUserIds.set(next);
  }

  public getUniqueCategories(entries: TimeSheetEntry[]): string {
    const categories = entries
      .map((entry) => entry.category)
      .filter((category) => category && category.trim() !== '');
    const list = [...new Set(categories)].sort();
    return list.join(', ');
  }

  public getUniqueCategoriesList(entries: TimeSheetEntry[]): string[] {
    const categories = entries
      .map((entry) => entry.category)
      .filter((category) => category && category.trim() !== '');
    return [...new Set(categories)].sort();
  }

  public async onEntryClick(group: UnapprovedEntryGroup): Promise<void> {
    try {
      const allEntries =
        await this.timeSheetEntryService.findByUserAndDate(
          group.userId,
          group.date,
        );

      const unapprovedEntries = allEntries.filter((entry) => !entry.approved);

      const modalRef = this.modalService.open(UnapprovedEntriesModalComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: true,
        size: 'lg',
      });
      Object.assign(modalRef.componentInstance, {
        entries: allEntries,
        unapprovedEntries: unapprovedEntries,
        date: group.date,
        userId: group.userId,
        preloadedUser: this.usersById().get(group.userId),
        onApprove: async () => {
          await this.approveEntries(unapprovedEntries);
        },
      });

      modalRef.result.then(() => {}, () => {});
    } catch (error) {
      this.toastService.error('Error loading time entries');
    }
  }

  private async approveEntries(entries: TimeSheetEntry[]): Promise<void> {
    try {
      this.isLoading.set(true);
      for (const entry of entries) {
        entry.approved = true;
        await this.timeSheetEntryService.save(entry);
      }
      this.toastService.success(`Approved ${entries.length} time entries`);
    } catch (error) {
      this.toastService.error('Error approving time entries');
    } finally {
      this.isLoading.set(false);
    }
  }
}
