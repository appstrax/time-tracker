import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { TimeSheetEntry } from 'src/app/models/time-sheet-entry.model';

@Component({
  selector: 'app-time-sheet-date-selector',
  standalone: true,
  templateUrl: './time-sheet-date-selector.component.html',
  styleUrl: './time-sheet-date-selector.component.scss'
})
export class TimeSheetDateSelectorComponent implements OnInit {
  @Input() timeSheetEntries: TimeSheetEntry[] = [];
  @Input() isLoading: boolean = false;

  @Output() weekChange = new EventEmitter<{ start: Date; end: Date }>();
  @ViewChild('datePicker') datePicker?: ElementRef<HTMLInputElement>;

  public currentWeekStart: Date = new Date();
  public currentWeekEnd: Date = new Date();
  private maxDate: Date = new Date();

  ngOnInit(): void {
    this.initializeCurrentWeek();
    this.calculateDateRange();
    this.emitWeekChange();
  }


  initializeCurrentWeek(): void {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setUTCDate(today.getUTCDate() + diff);
    this.currentWeekStart.setUTCHours(0, 0, 0, 0);

    this.currentWeekEnd = new Date(this.currentWeekStart);
    this.currentWeekEnd.setUTCDate(this.currentWeekStart.getUTCDate() + 6);
    this.currentWeekEnd.setUTCHours(0, 0, 0, 0);
  }

  calculateDateRange(): void {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    this.maxDate = new Date(today);
    this.maxDate.setUTCDate(today.getUTCDate() + diff);
    this.maxDate.setUTCHours(0, 0, 0, 0);
  }


  getWeekKey(weekStart: Date): string {
    const year = weekStart.getUTCFullYear();
    const month = String(weekStart.getUTCMonth() + 1).padStart(2, '0'); // getUTCMonth() is 0-indexed, so add 1
    const date = String(weekStart.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  previousWeek(): void {
    this.currentWeekStart.setUTCDate(this.currentWeekStart.getUTCDate() - 7);
    this.currentWeekEnd.setUTCDate(this.currentWeekEnd.getUTCDate() - 7);
    this.emitWeekChange();
  }

  nextWeek(): void {
    if (this.canGoToNextWeek()) {
      this.currentWeekStart.setUTCDate(this.currentWeekStart.getUTCDate() + 7);
      this.currentWeekEnd.setUTCDate(this.currentWeekEnd.getUTCDate() + 7);
      this.emitWeekChange();
    }
  }

  canGoToNextWeek(): boolean {
    const nextWeekStart = new Date(this.currentWeekStart);
    nextWeekStart.setUTCDate(this.currentWeekStart.getUTCDate() + 7);
    return nextWeekStart.getTime() <= this.maxDate.getTime();
  }

  goToCurrentWeek(): void {
    this.initializeCurrentWeek();
    this.emitWeekChange();
  }

  emitWeekChange(): void {
    this.weekChange.emit({
      start: new Date(this.currentWeekStart),
      end: new Date(this.currentWeekEnd)
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  openDatePicker(): void {
    if (this.datePicker) {
      const input = this.datePicker.nativeElement;
      try {
        input.showPicker();
      } catch {
        input.click(); //older and non chrome browsers
      }
    }
  }

  getDatePickerValue(): string {
    const year = this.currentWeekStart.getUTCFullYear();
    const month = String(this.currentWeekStart.getUTCMonth() + 1).padStart(2, '0');
    const day = String(this.currentWeekStart.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onDateSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      const selectedDate = new Date(input.value);
      this.navigateToWeek(selectedDate);
    }
  }

  navigateToWeek(date: Date): void {
    const dayOfWeek = date.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekStart = new Date(date);
    weekStart.setUTCDate(date.getUTCDate() + diff);
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(0, 0, 0, 0);

    if (weekStart.getTime() > this.maxDate.getTime()) {
      this.initializeCurrentWeek();
    } else {
      this.currentWeekStart = weekStart;
      this.currentWeekEnd = weekEnd;
    }
    this.emitWeekChange();
  }

  isToday(): boolean {
    const newDate = new Date();
    newDate.setUTCHours(0, 0, 0, 0);
    if (newDate.getTime() >= this.currentWeekStart.getTime() &&
      newDate.getTime() <= this.currentWeekEnd.getTime()) {
      return true;
    }
    return false;
  }
}
