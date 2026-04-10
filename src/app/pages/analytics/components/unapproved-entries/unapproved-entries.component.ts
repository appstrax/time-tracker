import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { appstraxAuth } from '@appstrax/services/auth';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { TimeSheetEntry } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { TimeSheetDisplayUtil } from '@utils';
import { UnapprovedEntriesModalComponent } from '../../modals/unapproved-entries/unapproved-entries.modal';

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
export class UnapprovedEntriesComponent implements OnInit {
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
  public readonly currentUserId = signal('');
  public readonly isLoading = signal(false);

  private timeSheetEntryService = inject(TimeSheetEntryService);
  private toastService = inject(ToastService);
  private modalService = inject(NgbModal);
  public displayUtils = inject(TimeSheetDisplayUtil);

  async ngOnInit(): Promise<void> {
    const user = await appstraxAuth.getUser();
    if (user) {
      this.currentUserId.set(user.id);
    }
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
