import { Component, Input, OnInit, OnChanges, SimpleChanges, Signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@state';
import { TimeSheetEntry, Project } from '@models';
import { TimeSheetEntryService, ToastService, ModalService } from '@services';
import { appstraxAuth } from '@appstrax/services/auth';

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
    this.groupUnapprovedEntries();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeSheetEntries'] && !changes['timeSheetEntries'].firstChange) {
      this.groupUnapprovedEntries();
    }
  }

  private groupUnapprovedEntries(): void {
    // Filter only unapproved entries
    const unapproved = this.timeSheetEntries.filter(entry => !entry.approved);

    // Group by date and userId
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
      group.totalHours += entry.hours;
    });

    // Convert to array and sort by date (newest first)
    this.groupedEntries = Array.from(groupsMap.values()).sort((a, b) =>
      b.date.getTime() - a.date.getTime()
    );
  }

  public getUserName(userId: string): string {
    if (userId === this.currentUserId) {
      return 'You';
    }
    // In a real app, you'd fetch user names from a user service
    return userId.substring(0, 8);
  }

  public formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  public formatHours(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) return `${wholeHours}h`;
    return `${wholeHours}h ${minutes}m`;
  }

  public onEntryClick(group: UnapprovedEntryGroup): void {
    const modalRef = this.modalService.showUnapprovedEntriesModal({
      entries: group.entries,
      date: group.date,
      userId: group.userId,
      onApprove: async () => {
        await this.approveEntries(group.entries);
      }
    });

    modalRef.result.then(() => {
      // Modal closed successfully
    }, () => {
      // Modal dismissed
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
      // Remove approved entries from the list
      this.groupUnapprovedEntries();
    } catch (error) {
      this.toastService.error('Error approving time entries');
    } finally {
      this.isLoading = false;
    }
  }
}

