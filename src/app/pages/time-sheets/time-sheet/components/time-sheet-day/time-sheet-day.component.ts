import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Project, TimeSheetEntry } from '@models';
import { TimeSheetEntryModal } from '@modals';
import { TimeSheetEntryService, ToastService } from '@services';
import {
  TimeSheetDisplayUtil,
  getProjectColor,
  FUTURE_TIMESHEET_ENTRY_TOAST,
  isFutureUtcCalendarDay,
} from '@utils';

import { TimeSheetNumberLineComponent } from '../time-sheet-number-line/time-sheet-number-line.component';

@Component({
  selector: 'app-time-sheet-day',
  standalone: true,
  templateUrl: './time-sheet-day.component.html',
  styleUrl: './time-sheet-day.component.scss',
  imports: [TimeSheetNumberLineComponent, DatePipe],
})
export class TimeSheetDayComponent {
  private readonly displayUtil = inject(TimeSheetDisplayUtil);

  public readonly date = input(new Date());
  public readonly projects = input<Project[]>([]);
  public readonly projectColorById = input<Map<string, string>>(new Map());
  public readonly categories = input<string[]>([]);
  public readonly entries = input<TimeSheetEntry[]>([]);

  public readonly save = output<TimeSheetEntry | undefined>();
  public readonly entriesExpanded = signal(false);

  public readonly approved = computed(() =>
    this.entries().some((entry) => entry.approved),
  );

  public readonly isFutureDay = computed(() =>
    isFutureUtcCalendarDay(this.date()),
  );
  public readonly sortedEntries = computed(() =>
    [...this.entries()].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    ),
  );

  public readonly loggedHours = computed(() =>
    this.sortedEntries().reduce((sum, entry) => sum + entry.hours, 0),
  );

  public readonly entryCountLabel = computed(() => {
    const count = this.sortedEntries().length;
    return count === 1 ? '1 entry' : `${count} entries`;
  });

  public formatLoggedBadge(): string {
    const hours = this.loggedHours();
    if (!hours) return '';
    const normalized = Math.round(hours * 4) / 4;
    const label = Number.isInteger(normalized)
      ? `${normalized}h`
      : `${parseFloat(normalized.toFixed(2))}h`;
    return `${label} logged`;
  }

  public formatEntryHours(hours: number): string {
    return this.displayUtil.formatQuarterHourDuration(hours);
  }

  public projectName(entry: TimeSheetEntry): string {
    return this.displayUtil.getProjectName(entry.projectId, this.projects());
  }

  public entryCategory(entry: TimeSheetEntry): string {
    return entry.category?.trim() || 'No category';
  }

  public entryDescription(entry: TimeSheetEntry): string {
    const description = entry.description?.trim();
    return description || 'No description';
  }

  public projectColor(entry: TimeSheetEntry): string {
    const fromMap = this.projectColorById().get(entry.projectId);
    if (fromMap) return fromMap;
    return getProjectColor(entry.projectId, this.projects());
  }

  public toggleEntriesExpanded(): void {
    this.entriesExpanded.update((expanded) => !expanded);
  }

  constructor(
    private modalService: NgbModal,
    private toastService: ToastService,
    private entryService: TimeSheetEntryService,
  ) {}

  private async saveTimeSheetEntry(entry: TimeSheetEntry): Promise<void> {
    try {
      entry = await this.entryService.save(entry);
      this.save.emit(entry);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error saving time sheet entry';
      this.toastService.error(message);
    }
  }

  private async deleteTimeSheetEntry(entry: TimeSheetEntry): Promise<void> {
    try {
      await this.entryService.delete(entry.id);
      this.save.emit(undefined);
    } catch {
      this.toastService.error('Error deleting time sheet entry');
    }
  }

  public openTimeSheetEntryModal(entryOrHours?: TimeSheetEntry | number): void {
    const isNewEntry =
      typeof entryOrHours === 'number' ||
      !entryOrHours ||
      !entryOrHours.id;

    if (isNewEntry && this.isFutureDay()) {
      this.toastService.error(FUTURE_TIMESHEET_ENTRY_TOAST);
      return;
    }

    const timeSheetEntry =
      typeof entryOrHours === 'number'
        ? this.createSeededTimeSheetEntry(entryOrHours)
        : entryOrHours?.clone() || new TimeSheetEntry();

    const options = {
      timeSheetEntry,
      date: this.date(),
      categories: this.categories(),
    };

    const modalRef = this.modalService.open(TimeSheetEntryModal, {
      centered: true,
      backdrop: 'static',
      keyboard: true,
      size: 'lg',
      backdropClass: 'time-sheet-entry-backdrop',
    });
    Object.assign(modalRef.componentInstance, options);
    modalRef.result.then(
      (result: { action: string; timeSheetEntry: TimeSheetEntry }) => {
        if (result.action === 'save') {
          this.saveTimeSheetEntry(result.timeSheetEntry);
        } else if (result.action === 'delete') {
          this.deleteTimeSheetEntry(result.timeSheetEntry);
        }
      },
      () => {},
    );
  }

  private createSeededTimeSheetEntry(totalHours: number): TimeSheetEntry {
    const timeSheetEntry = new TimeSheetEntry();
    const loggedHours = this.entries().reduce(
      (sum, entry) => sum + entry.hours,
      0,
    );
    const nextHours = Math.max(0, totalHours - loggedHours);
    timeSheetEntry.hours = Math.round(nextHours * 4) / 4;
    return timeSheetEntry;
  }
}
