import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { getUserDisplayName, TimeSheetDisplayUtil } from '@utils';
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
  public readonly compact = input(false);
  public readonly users = input<User[]>([]);
  public readonly canApprove = input(false);
  public readonly entryUpdated = output<TimeSheetEntry>();
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
  public readonly usersById = computed(
    () => new Map(this.users().map((user) => [user.id, user])),
  );
  public readonly isLoading = signal(false);

  private timeSheetEntryService = inject(TimeSheetEntryService);
  private toastService = inject(ToastService);
  private modalService = inject(NgbModal);
  public displayUtils = inject(TimeSheetDisplayUtil);

  public getDisplayUserName(userId: string): string {
    const user = this.usersById().get(userId) ?? null;
    return getUserDisplayName(user, userId);
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

      const modalRef = this.modalService.open(UnapprovedEntriesModalComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: true,
        size: 'lg',
      });
      Object.assign(modalRef.componentInstance, {
        entries: allEntries,
        date: group.date,
        userId: group.userId,
        users: this.users(),
        canManageStatus: this.canApprove(),
        onEntryStatusChange: this.canApprove()
          ? (entry: TimeSheetEntry, approved: boolean) =>
              this.updateEntryStatus(entry, approved)
          : undefined,
      });

      modalRef.result.then(() => {}, () => {});
    } catch {
      this.toastService.error('Error loading time entries');
    }
  }

  private async updateEntryStatus(
    entry: TimeSheetEntry,
    approved: boolean,
  ): Promise<TimeSheetEntry> {
    try {
      entry.approved = approved;
      const savedEntry = await this.timeSheetEntryService.save(entry);
      this.entryUpdated.emit(savedEntry);
      this.toastService.success(
        approved ? 'Time entry approved' : 'Time entry marked pending',
      );
      return savedEntry;
    } catch {
      this.toastService.error('Error updating time entry status');
      throw new Error('status update failed');
    }
  }
}
