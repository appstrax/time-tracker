import { Tooltip } from 'bootstrap';
import { DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Project, TimeSheetEntry } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';

import { TimeSheetNumberLineComponent } from '../time-sheet-number-line/time-sheet-number-line.component';
import { TimeSheetEntryComponent } from '../../../modals/time-sheet-entry/time-sheet-entry.modal';

@Component({
  selector: 'app-time-sheet-day',
  standalone: true,
  templateUrl: './time-sheet-day.component.html',
  styleUrl: './time-sheet-day.component.scss',
  imports: [TimeSheetNumberLineComponent, DatePipe],
})
export class TimeSheetDayComponent {
  public readonly date = input(new Date());
  public readonly projects = input<Project[]>([]);
  public readonly categories = input<string[]>([]);
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly categoryColors = input<Map<string, string>>(
    new Map<string, string>(),
  );

  public readonly onSave = output<TimeSheetEntry | undefined>();
  public readonly isAddEntryButtonVisible = computed(() =>
    this.isWithinEditableRange(this.date()),
  );
  public readonly isApproved = computed(() =>
    this.entries().some((entry) => entry.approved),
  );

  private readonly MAX_WEEKS_BACK_FOR_ADD_ENTRY: number = 3;

  private readonly addEntryBtn = viewChild<ElementRef<HTMLButtonElement>>(
    'addEntryBtn',
  );
  private readonly lockIcon = viewChild<ElementRef<HTMLElement>>('lockIcon');

  constructor(
    private modalService: NgbModal,
    private toastService: ToastService,
    private timeSheetEntryService: TimeSheetEntryService,
  ) {
    effect((onCleanup) => {
      const addEntryButton = this.addEntryBtn();
      if (!addEntryButton) return;

      const tooltip = new Tooltip(addEntryButton.nativeElement);
      onCleanup(() => tooltip.dispose());
    });

    effect((onCleanup) => {
      if (!this.isApproved()) return;

      const lockIcon = this.lockIcon();
      if (!lockIcon) return;

      const tooltip = new Tooltip(lockIcon.nativeElement);
      onCleanup(() => tooltip.dispose());
    });
  }

  private isWithinEditableRange(date: Date): boolean {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const diff = !dayOfWeek ? -6 : 1 - dayOfWeek;

    const currentWeekStart = new Date(today);
    currentWeekStart.setUTCDate(today.getUTCDate() + diff);
    currentWeekStart.setUTCHours(0, 0, 0, 0);

    const threeWeeksAgoStart = new Date(currentWeekStart);
    threeWeeksAgoStart.setUTCDate(
      currentWeekStart.getUTCDate() -
        (this.MAX_WEEKS_BACK_FOR_ADD_ENTRY - 1) * 7,
    );

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setUTCDate(currentWeekStart.getUTCDate() + 6);
    currentWeekEnd.setUTCHours(23, 59, 59, 999);

    return date >= threeWeeksAgoStart && date <= currentWeekEnd;
  }

  private async saveTimeSheetEntry(
    timeSheetEntry: TimeSheetEntry,
  ): Promise<void> {
    try {
      timeSheetEntry = await this.timeSheetEntryService.save(timeSheetEntry);
      this.onSave.emit(timeSheetEntry);
    } catch (error) {
      this.toastService.error('Error saving time sheet entry');
    }
  }

  private async deleteTimeSheetEntry(
    timeSheetEntry: TimeSheetEntry,
  ): Promise<void> {
    try {
      await this.timeSheetEntryService.delete(timeSheetEntry.id);
      this.onSave.emit(undefined);
    } catch (error) {
      this.toastService.error('Error deleting time sheet entry');
    }
  }

  public openTimeSheetEntryModal(timeSheetEntryOrHours?: TimeSheetEntry | number): void {
    const timeSheetEntry =
      typeof timeSheetEntryOrHours === 'number'
        ? this.createSeededTimeSheetEntry(timeSheetEntryOrHours)
        : timeSheetEntryOrHours?.clone() || new TimeSheetEntry();

    const options = {
      timeSheetEntry,
      date: this.date(),
      categories: this.categories(),
    };

    const modalRef = this.modalService.open(TimeSheetEntryComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: true,
    });
    Object.assign(modalRef.componentInstance, options);
    modalRef.result.then(
      (result: any) => {
        if (result.action === 'save') {
          this.saveTimeSheetEntry(result.timeSheetEntry);
        } else if (result.action === 'delete') {
          this.deleteTimeSheetEntry(result.timeSheetEntry);
        }
      },
      (reason: any) => {},
    );
  }

  private createSeededTimeSheetEntry(hours: number): TimeSheetEntry {
    const timeSheetEntry = new TimeSheetEntry();
    timeSheetEntry.hours = hours;
    return timeSheetEntry;
  }
}
