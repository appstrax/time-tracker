import { Component, Input, OnInit, OnChanges, SimpleChanges, Signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@state';
import { TimeSheetEntry } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { appstraxAuth } from '@appstrax/services/auth';
import { ModalService } from 'src/app/services/modal.service';
import { TimeCalculationUtils } from 'src/app/utils/time-calculation-utils';

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
  styleUrl: './unapproved-entries.component.scss'
})
export class UnapprovedEntriesComponent implements OnInit, OnChanges {
  @Input() timeSheetEntries: TimeSheetEntry[] = [];
  @Input() canApprove: boolean = false;

  public groupedEntries: UnapprovedEntryGroup[] = [];
  public currentUserId: string = '';
  public isLoading: boolean = false;

  private store = inject(Store);
  private timeSheetEntryService = inject(TimeSheetEntryService);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);

  async ngOnInit(): Promise<void> {
    const user = await appstraxAuth.getUser();
    if (user) {
      this.currentUserId = user.id;
    }
    await this.groupUnapprovedEntries();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['timeSheetEntries'] && !changes['timeSheetEntries'].firstChange) {
      await this.groupUnapprovedEntries();
    }
  }

  public getUniqueCategories(entries: TimeSheetEntry[]): string {
    const categories = entries
      .map(entry => entry.category)
      .filter(category => category && category.trim() !== '');
    let list = [...new Set(categories)].sort();
    return list.join(', ');
  }

  public getUniqueCategoriesList(entries: TimeSheetEntry[]): string[] {
    const categories = entries
      .map(entry => entry.category)
      .filter(category => category && category.trim() !== '');
    return [...new Set(categories)].sort();
  }

  private async groupUnapprovedEntries(): Promise<void> {
    const unapproved = this.timeSheetEntries.filter(entry => !entry.approved);

    const groupsMap = new Map<string, UnapprovedEntryGroup>();

    unapproved.forEach(entry => {
      const entryDate = new Date(entry.date);
      const dateKey = entryDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const groupKey = `${dateKey}_${entry.userId}`;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          date: entryDate,
          userId: entry.userId,
          totalHours: 0,
          entries: []
        });
      }

      const group = groupsMap.get(groupKey)!;
      group.entries.push(entry);
    });

    for (const [groupKey, group] of groupsMap.entries()) {
      try {
        const allEntriesForDay = await this.timeSheetEntryService.getTimeSheetEntriesByUserIdAndDate(
          group.userId,
          group.date
        );

        group.totalHours = allEntriesForDay.reduce((sum, entry) => sum + entry.hours, 0);
      } catch (error) {
        console.error('Error loading all entries for day:', error);
        const filteredEntriesForDay = this.timeSheetEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          const dateKey = entryDate.toISOString().split('T')[0];
          return entry.userId === group.userId &&
                 dateKey === groupKey.split('_')[0];
        });
        group.totalHours = filteredEntriesForDay.reduce((sum, entry) => sum + entry.hours, 0);
      }
    }

    this.groupedEntries = Array.from(groupsMap.values()).sort((a, b) =>
      b.date.getTime() - a.date.getTime()
    );
  }

  public getUserName(userId: string): string {
    if (userId === this.currentUserId) {
      return 'You';
    }
    return userId.substring(0, 8);
  }



  public formatHours(hours: number): string {
    return TimeCalculationUtils.formatHours(hours);
  }

  public async onEntryClick(group: UnapprovedEntryGroup): Promise<void> {
    try {
      const allEntries = await this.timeSheetEntryService.getTimeSheetEntriesByUserIdAndDate(
        group.userId,
        group.date
      );

      const unapprovedEntries = allEntries.filter(entry => !entry.approved);

      const modalRef = this.modalService.showUnapprovedEntriesModal({
        entries: allEntries,
        unapprovedEntries: unapprovedEntries,
        date: group.date,
        userId: group.userId,
        onApprove: async () => {
          await this.approveEntries(unapprovedEntries);
        }
      });

      modalRef.result.then(async () => {
        await this.groupUnapprovedEntries();
      }, () => {
      });
    } catch (error) {
      this.toastService.error('Error loading time entries');
    }
  }

  private async approveEntries(entries: TimeSheetEntry[]): Promise<void> {
    try {
      this.isLoading = true;
      for (const entry of entries) {
        entry.approved = true;
        await this.timeSheetEntryService.save(entry);
      }
      this.toastService.success(`Approved ${entries.length} time entries`);
      await this.groupUnapprovedEntries();
    } catch (error) {
      this.toastService.error('Error approving time entries');
    } finally {
      this.isLoading = false;
    }
  }
}

