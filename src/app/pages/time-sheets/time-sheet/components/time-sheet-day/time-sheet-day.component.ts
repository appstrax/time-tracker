import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, Signal, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { TimeSheetEntry } from 'src/app/models/time-sheet-entry.model';
import { TimeSheetNumberLineComponent } from '../time-sheet-number-line/time-sheet-number-line.component';
import { TimeSheetEntryCrudOptions } from '../../../modals/time-sheet-entry-crud/time-sheet-entry-crud.component';
import { ModalService } from 'src/app/services/modal.service';
import { appstraxAuth, User } from '@appstrax/services/auth';
import { Project } from '@models';
import { TimeSheetEntryService } from 'src/app/services/time-sheet-entry.service';
import { Tooltip } from 'bootstrap';

@Component({
  selector: 'app-time-sheet-day',
  standalone: true,
  templateUrl: './time-sheet-day.component.html',
  styleUrl: './time-sheet-day.component.scss',
  imports: [TimeSheetNumberLineComponent, DatePipe]
})
export class TimeSheetDayComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() date: Date = new Date();
  @Input() entries: TimeSheetEntry[] = [];
  @Input() categoryColors: Map<string, string> = new Map<string, string>();
  @Input() availableCategories: string[] = [];

  @Input() projects: Project[] = [];
  @Output() onSave: EventEmitter<TimeSheetEntry> = new EventEmitter<TimeSheetEntry>();

  user: User | null = null;
  isWithinLastThreeWeeks: boolean = false;
  private addEntryTooltip?: Tooltip;

  @ViewChild('addEntryBtn', { static: false }) addEntryBtn?: ElementRef<HTMLButtonElement>;

  constructor(
    private modalService: ModalService,
    private timeSheetEntryService: TimeSheetEntryService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.user = await appstraxAuth.getUser();
    this.checkIfWithinLastNumberOfWeeks(3);
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

    this.isWithinLastThreeWeeks = this.date >= threeWeeksAgoStart && this.date <= currentWeekEnd;
  }


  async saveTimeSheetEntry(timeSheetEntry: TimeSheetEntry) {
    timeSheetEntry = await this.timeSheetEntryService.save(timeSheetEntry);
    this.onSave.emit(timeSheetEntry);
  }


  openTimeSheetEntryCrudModal(timeSheetEntry?: TimeSheetEntry | undefined) {
    const options = this.getTimeSheetEntryCrudOptions(timeSheetEntry);
    this.modalService.showTimeSheetEntryCrudModal(options);
  }

  getTimeSheetEntryCrudOptions(timeSheetEntry?: TimeSheetEntry | undefined) {
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

  onEntryClick(entry: TimeSheetEntry) {
    this.openTimeSheetEntryCrudModal(entry);
  }
}
