import { Tooltip } from 'bootstrap';
import { DatePipe } from '@angular/common';
import { OnInit, Output, OnChanges } from '@angular/core'
import { SimpleChanges, AfterViewInit } from '@angular/core'
import { appstraxAuth, User } from '@appstrax/services/auth';
import { Component, EventEmitter, Input } from '@angular/core'
import { ViewChild, ElementRef, OnDestroy } from '@angular/core';

import { Project, TimeSheetEntry } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';


import { TimeSheetNumberLineComponent } from '../time-sheet-number-line/time-sheet-number-line.component';
import { TimeSheetEntryCrudOptions } from '../../../modals/time-sheet-entry-crud/time-sheet-entry-crud.component';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-time-sheet-day',
  standalone: true,
  templateUrl: './time-sheet-day.component.html',
  styleUrl: './time-sheet-day.component.scss',
  imports: [TimeSheetNumberLineComponent, DatePipe]
})
export class TimeSheetDayComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @Input() date: Date = new Date();
  @Input() projects: Project[] = [];
  @Input() entries: TimeSheetEntry[] = [];
  @Input() availableCategories: string[] = [];
  @Input() categoryColors: Map<string, string> = new Map<string, string>();

  @Output() onSave: EventEmitter<TimeSheetEntry> = new EventEmitter<TimeSheetEntry>();

  private user: User | null = null;
  private addEntryTooltip?: Tooltip;

  isAddEntryButtonVisible: boolean = false;

  @ViewChild('addEntryBtn', { static: false }) addEntryBtn?: ElementRef<HTMLButtonElement>;

  constructor(
    private modalService: ModalService,
    private toastService: ToastService,
    private timeSheetEntryService: TimeSheetEntryService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.user = await appstraxAuth.getUser();
    this.checkIfWithinLastNumberOfWeeks(3);
  }

  ngOnDestroy(): void {
    this.addEntryTooltip?.dispose();
  }

  ngAfterViewInit(): void {
    if (this.addEntryBtn) {
      this.addEntryTooltip = new Tooltip(this.addEntryBtn.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['date']) {
      this.checkIfWithinLastNumberOfWeeks(3);
    }
  }

  checkIfWithinLastNumberOfWeeks(numberOfWeeks: number): void {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const currentWeekStart = new Date(today);
    currentWeekStart.setUTCDate(today.getUTCDate() + diff);
    currentWeekStart.setUTCHours(0, 0, 0, 0);

    const threeWeeksAgoStart = new Date(currentWeekStart);
    threeWeeksAgoStart.setUTCDate(currentWeekStart.getUTCDate() - ((numberOfWeeks - 1) * 7));

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setUTCDate(currentWeekStart.getUTCDate() + 6);
    currentWeekEnd.setUTCHours(23, 59, 59, 999);

    this.isAddEntryButtonVisible = this.date >= threeWeeksAgoStart && this.date <= currentWeekEnd;
  }


  async saveTimeSheetEntry(timeSheetEntry: TimeSheetEntry): Promise<void> {
    try {
      timeSheetEntry = await this.timeSheetEntryService.save(timeSheetEntry);
      this.onSave.emit(timeSheetEntry);
    } catch (error) {
      this.toastService.error('Error saving time sheet entry');
    }
  }


  openTimeSheetEntryCrudModal(timeSheetEntry?: TimeSheetEntry | undefined): void {
    const options = this.getTimeSheetEntryCrudOptions(timeSheetEntry);
    this.modalService.showTimeSheetEntryCrudModal(options);
  }

  getTimeSheetEntryCrudOptions(timeSheetEntry?: TimeSheetEntry | undefined): TimeSheetEntryCrudOptions {
    const options = new TimeSheetEntryCrudOptions();
    if (!timeSheetEntry) {
      timeSheetEntry = new TimeSheetEntry();
      timeSheetEntry.userId = this.user?.id ?? '';
      timeSheetEntry.date = this.date;
    }
    options.timeSheetEntry = timeSheetEntry;
    options.timeSheetEntry.date = this.date;
    options.onSave = (entry: TimeSheetEntry) => this.saveTimeSheetEntry(entry);
    options.availableCategories = this.availableCategories;
    return options;
  }

  onEntryClick(entry: TimeSheetEntry): void {
    this.openTimeSheetEntryCrudModal(entry);
  }
}
