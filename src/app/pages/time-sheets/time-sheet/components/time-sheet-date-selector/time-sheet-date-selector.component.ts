import { DatePipe } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, Input, ViewChild, ElementRef } from '@angular/core';
import { TimeSheetEntry } from 'src/app/models/time-sheet-entry.model';

@Component({
  selector: 'app-time-sheet-date-selector',
  standalone: true,
  templateUrl: './time-sheet-date-selector.component.html',
  styleUrl: './time-sheet-date-selector.component.scss',
  imports: [DatePipe]
})
export class TimeSheetDateSelectorComponent implements OnInit {
  @Input() isLoading: boolean = false;

  @Output() weekChange = new EventEmitter<{ start: Date; end: Date }>();

  @ViewChild('datePicker') datePicker?: ElementRef<HTMLInputElement>;

  private maxDate: Date = new Date();
  public selectedWeekEnd: Date = new Date();
  public selectedWeekStart: Date = new Date();

  public ngOnInit(): void {
    this.calculateDateRange();
    this.initializeCurrentWeek();
  }

  public initializeCurrentWeek(): void {
    const today = new Date();
    this.navigateToWeek(today);
  }

  private calculateDateRange(): void {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const diff = !dayOfWeek ? -6 : 1 - dayOfWeek;

    this.maxDate = new Date(today);
    this.maxDate.setUTCDate(today.getUTCDate() + diff);
    this.maxDate.setUTCHours(0, 0, 0, 0);
  }

  public previousWeek(): void {
    this.updateWeekRange(-7);
  }

  public nextWeek(): void {
    if (this.canGoToNextWeek()) {
      this.updateWeekRange(7);
    }
  }

  public canGoToNextWeek(): boolean {
    const nextWeekStart = new Date(this.selectedWeekStart);
    nextWeekStart.setUTCDate(this.selectedWeekStart.getUTCDate() + 7);
    return nextWeekStart.getTime() <= this.maxDate.getTime();
  }

  private updateWeekRange(increment: number): void {
    let currentWeekStart = new Date(this.selectedWeekStart);
    let currentWeekEnd = new Date(this.selectedWeekEnd);
    currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + increment);
    currentWeekEnd.setUTCDate(currentWeekEnd.getUTCDate() + increment);
    this.selectedWeekStart = currentWeekStart;
    this.selectedWeekEnd = currentWeekEnd;
    this.emitWeekChange();
  }

  private navigateToWeek(date: Date): void {
    const dayOfWeek = date.getUTCDay();
    const diff = !dayOfWeek ? -6 : 1 - dayOfWeek;

    const weekStart = new Date(date);
    weekStart.setUTCDate(date.getUTCDate() + diff);
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(0, 0, 0, 0);

    if (weekStart.getTime() > this.maxDate.getTime()) {
      const today = new Date();
      this.navigateToWeek(today);
    } else {
      this.selectedWeekStart = weekStart;
      this.selectedWeekEnd = weekEnd;
    }
    this.emitWeekChange();
  }

  private emitWeekChange(): void {
    this.weekChange.emit({
      start: this.selectedWeekStart,
      end: this.selectedWeekEnd
    });
  }

  public isCurrentWeek(): boolean {
    const newDate = new Date();
    newDate.setUTCHours(0, 0, 0, 0);
    return newDate.getTime() >= this.selectedWeekStart.getTime() &&
      newDate.getTime() <= this.selectedWeekEnd.getTime();
  }

  public openDatePicker(): void {
    if (this.datePicker) {
      const input = this.datePicker.nativeElement;
      try {
        input.showPicker();
      } catch {
        input.click(); //older and non chrome browsers
      }
    }
  }

  public getDatePickerValue(): string {
    const year = this.selectedWeekStart.getUTCFullYear();
    const month = String(this.selectedWeekStart.getUTCMonth() + 1).padStart(2, '0');
    const day = String(this.selectedWeekStart.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public onDateSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      const selectedDate = new Date(input.value);
      this.navigateToWeek(selectedDate);
    }
  }
}
