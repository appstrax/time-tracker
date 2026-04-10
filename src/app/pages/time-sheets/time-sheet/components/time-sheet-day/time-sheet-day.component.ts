import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Project, TimeSheetEntry } from '@models';
import { TimeSheetEntryModal } from '@modals';
import { TimeSheetEntryService, ToastService } from '@services';

import { TimeSheetNumberLineComponent } from '../time-sheet-number-line/time-sheet-number-line.component';

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

  public readonly save = output<TimeSheetEntry | undefined>();
  public readonly approved = computed(() =>
    this.entries().some((entry) => entry.approved),
  );
  public readonly sortedEntries = computed(() =>
    this.entries().sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
  );

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
      this.toastService.error('Error saving time sheet entry');
    }
  }

  private async deleteTimeSheetEntry(entry: TimeSheetEntry): Promise<void> {
    try {
      await this.entryService.delete(entry.id);
      this.save.emit(undefined);
    } catch (error) {
      this.toastService.error('Error deleting time sheet entry');
    }
  }

  public openTimeSheetEntryModal(entryOrHours?: TimeSheetEntry | number): void {
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
