import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@state';
import { TimeSheetEntry } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { appstraxAuth } from '@appstrax/services/auth';
import { ModalService } from 'src/app/services/modal.service';
import { TimeSheetDisplayUtilsService } from '../../services/time-sheet-display-utils.service';

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

  private timeSheetEntryService = inject(TimeSheetEntryService);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);
  public displayUtils = inject(TimeSheetDisplayUtilsService);

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
    const list = [...new Set(categories)].sort();
    return list.join(', ');
  }

  public getUniqueCategoriesList(entries: TimeSheetEntry[]): string[] {
    const categories = entries
      .map(entry => entry.category)
      .filter(category => category && category.trim() !== '');
    return [...new Set(categories)].sort();
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

  private async groupUnapprovedEntries(): Promise<void> {
    const unapproved = this.timeSheetEntries.filter(entry => !entry.approved);
    let groupsMap = await this.createDateGroups(unapproved);
    groupsMap = await this.groupUnapprovedEntriesByDates(groupsMap, unapproved);

    this.groupedEntries = Array.from(groupsMap.values()).sort((a, b) =>
      b.date.getTime() - a.date.getTime()
    );
  }


  private async createDateGroups(entries: TimeSheetEntry[]): Promise<Map<string, UnapprovedEntryGroup>> {
    const groupsMap = new Map<string, UnapprovedEntryGroup>();

    entries.forEach(entry => {
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
    return groupsMap;
  }

  private async groupUnapprovedEntriesByDates(
    groupsMap: Map<string, UnapprovedEntryGroup>,
    unapprovedEntries: TimeSheetEntry[]
  ): Promise<Map<string, UnapprovedEntryGroup>> {
    for (const [groupKey, group] of groupsMap.entries()) {
      const allEntriesForDay = this.filterUnapprovedByDateAndUser(
        unapprovedEntries,
        group.userId,
        groupKey.split('_')[0],
      );

      group.totalHours = allEntriesForDay.reduce((sum, entry) => sum + entry.hours, 0);
    }
    return groupsMap;
  }

  private filterUnapprovedByDateAndUser(
    unapprovedEntries: TimeSheetEntry[],
    userId: string,
    groupDate: String,
  ): TimeSheetEntry[] {

    return unapprovedEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const dateKey = entryDate.toISOString().split('T')[0];
      return entry.userId === userId &&
        dateKey === groupDate;
    });

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

