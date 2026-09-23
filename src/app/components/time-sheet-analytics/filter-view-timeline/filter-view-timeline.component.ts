import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { TimeSheetEntry, Project, User } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { TimeSheetDisplayUtil } from '@utils';
import { UnapprovedEntriesModalComponent } from '@modals';

export interface TimelineDaySummary {
  date: Date;
  hours: number;
  approvedHours: number;
  pendingHours: number;
}

@Component({
  selector: 'app-filter-view-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-view-timeline.component.html',
  styleUrl: './filter-view-timeline.component.scss',
})
export class FilterViewTimelineComponent {
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly projects = input<Project[]>([]);
  public readonly users = input<User[]>([]);
  public readonly compact = input(false);
  public readonly canManageStatus = input(false);

  public readonly entryUpdated = output<TimeSheetEntry>();

  public displayUtils = inject(TimeSheetDisplayUtil);
  private readonly modalService = inject(NgbModal);
  private readonly entryService = inject(TimeSheetEntryService);
  private readonly toastService = inject(ToastService);

  public readonly timelineData = computed((): TimelineDaySummary[] => {
    const dateMap = new Map<
      string,
      { hours: number; approvedHours: number; pendingHours: number }
    >();

    this.entries().forEach((entry) => {
      const dateKey = this.toDateKey(entry.date);
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { hours: 0, approvedHours: 0, pendingHours: 0 });
      }
      const data = dateMap.get(dateKey)!;
      data.hours += entry.hours;
      if (entry.approved) {
        data.approvedHours += entry.hours;
      } else {
        data.pendingHours += entry.hours;
      }
    });

    return Array.from(dateMap.entries())
      .map(([dateKey, data]) => ({
        date: new Date(`${dateKey}T00:00:00.000Z`),
        ...data,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  public readonly maxHours = computed(() => {
    const timeline = this.timelineData();
    if (!timeline.length) return 1;
    return Math.max(...timeline.map((day) => day.hours), 1);
  });

  public openDayReview(day: TimelineDaySummary): void {
    const dateKey = this.toDateKey(day.date);
    const dayEntries = this.entries().filter(
      (entry) => this.toDateKey(entry.date) === dateKey,
    );

    const modalRef = this.modalService.open(UnapprovedEntriesModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: true,
      size: 'lg',
    });

    Object.assign(modalRef.componentInstance, {
      entries: dayEntries,
      date: day.date,
      headerEyebrow: 'Day review',
      showEntryUsers: true,
      users: this.users(),
      canManageStatus: this.canManageStatus(),
      onEntryStatusChange: this.canManageStatus()
        ? async (entry: TimeSheetEntry, approved: boolean) =>
            this.updateEntryStatus(entry, approved)
        : undefined,
    });

    modalRef.result.then(() => {}, () => {});
  }

  private async updateEntryStatus(
    entry: TimeSheetEntry,
    approved: boolean,
  ): Promise<TimeSheetEntry> {
    try {
      const toSave = entry.clone();
      toSave.approved = approved;
      const savedEntry = await this.entryService.save(toSave);
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

  private toDateKey(date: Date | string): string {
    return new Date(date).toISOString().split('T')[0];
  }
}
