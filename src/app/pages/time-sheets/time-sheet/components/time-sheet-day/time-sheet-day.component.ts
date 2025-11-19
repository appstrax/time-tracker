import { Tooltip } from 'bootstrap';
import { DatePipe, NgClass } from '@angular/common';
import { OnInit, Output, OnChanges } from '@angular/core';
import { SimpleChanges, AfterViewInit } from '@angular/core';
import { Component, EventEmitter, Input } from '@angular/core';
import { ViewChild, ElementRef, OnDestroy } from '@angular/core';

import { Project, TimeSheetEntry } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';

import { TimeSheetNumberLineComponent } from '../time-sheet-number-line/time-sheet-number-line.component';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-time-sheet-day',
  standalone: true,
  templateUrl: './time-sheet-day.component.html',
  styleUrl: './time-sheet-day.component.scss',
  imports: [TimeSheetNumberLineComponent, DatePipe],
})
export class TimeSheetDayComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() date: Date = new Date();
  @Input() projects: Project[] = [];
  @Input() categories: string[] = [];
  @Input() entries: TimeSheetEntry[] = [];
  @Input() categoryColors: Map<string, string> = new Map<string, string>();

  @Output() onSave: EventEmitter<TimeSheetEntry | undefined> =
    new EventEmitter<TimeSheetEntry | undefined>();

  private addEntryTooltip?: Tooltip;
  private lockIconTooltip?: Tooltip;
  public isAddEntryButtonVisible: boolean = false;
  public isApproved: boolean = false;

  private readonly MAX_WEEKS_BACK_FOR_ADD_ENTRY: number = 3;

  @ViewChild('addEntryBtn', { static: false })
  public addEntryBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('lockIcon', { static: false })
  public lockIcon?: ElementRef<HTMLButtonElement>;

  constructor(
    private modalService: ModalService,
    private toastService: ToastService,
    private timeSheetEntryService: TimeSheetEntryService
  ) { }

  public async ngOnInit(): Promise<void> {
    this.checkIfWithinLastNumberOfWeeks();
  }

  public ngOnDestroy(): void {
    this.addEntryTooltip?.dispose();
    this.lockIconTooltip?.dispose();
  }

  public ngAfterViewInit(): void {
    if (this.addEntryBtn) {
      this.addEntryTooltip = new Tooltip(this.addEntryBtn.nativeElement);
    }
    this.isApproved = this.entries.some(entry => entry.approved);
    this.initializeLockIconTooltip();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['date']) {
      this.checkIfWithinLastNumberOfWeeks();
    }
    const wasApproved = this.isApproved;
    this.isApproved = this.entries.some(entry => entry.approved);

    if (!wasApproved && this.isApproved) {
      setTimeout(() => {
        this.initializeLockIconTooltip();
      }, 0);
    }
  }

  private initializeLockIconTooltip(): void {
    if (this.lockIcon && this.isApproved) {
      this.lockIconTooltip?.dispose();
      this.lockIconTooltip = new Tooltip(this.lockIcon.nativeElement);
    }
  }

  private checkIfWithinLastNumberOfWeeks(): void {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const diff = !dayOfWeek ? -6 : 1 - dayOfWeek;

    const currentWeekStart = new Date(today);
    currentWeekStart.setUTCDate(today.getUTCDate() + diff);
    currentWeekStart.setUTCHours(0, 0, 0, 0);

    const threeWeeksAgoStart = new Date(currentWeekStart);
    threeWeeksAgoStart.setUTCDate(
      currentWeekStart.getUTCDate() -
      (this.MAX_WEEKS_BACK_FOR_ADD_ENTRY - 1) * 7
    );

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setUTCDate(currentWeekStart.getUTCDate() + 6);
    currentWeekEnd.setUTCHours(23, 59, 59, 999);

    this.isAddEntryButtonVisible =
      this.date >= threeWeeksAgoStart && this.date <= currentWeekEnd;
  }

  private async saveTimeSheetEntry(timeSheetEntry: TimeSheetEntry): Promise<void> {
    try {
      timeSheetEntry = await this.timeSheetEntryService.save(timeSheetEntry);
      this.onSave.emit(timeSheetEntry);
    } catch (error) {
      this.toastService.error('Error saving time sheet entry');
    }
  }

  private async deleteTimeSheetEntry(timeSheetEntry: TimeSheetEntry): Promise<void> {
    try {
      await this.timeSheetEntryService.delete(timeSheetEntry.id);
      this.onSave.emit(undefined);
    } catch (error) {
      this.toastService.error('Error deleting time sheet entry');
    }
  }

  public openTimeSheetEntryModal(timeSheetEntry?: TimeSheetEntry): void {
    const options = {
      timeSheetEntry: timeSheetEntry?.clone() || new TimeSheetEntry(),
      date: this.date,
      categories: this.categories,
    };

    this.modalService
      .showTimeSheetEntryModal(options)
      .result.then((result: any) => {
        if (result.action === 'save') {
          this.saveTimeSheetEntry(result.timeSheetEntry);
        } else if (result.action === 'delete') {
          this.deleteTimeSheetEntry(result.timeSheetEntry);
        }
      }, (reason: any) => { },);
  }
}
