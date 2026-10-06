import { DatePipe, NgClass } from '@angular/common';
import {
  Component,
  input,
  OnInit,
  ViewChild,
  computed,
  output,
  signal,
} from '@angular/core';
import {
  NgbDateStruct,
  NgbInputDatepicker,
} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-time-sheet-date-selector',
  standalone: true,
  templateUrl: './time-sheet-date-selector.component.html',
  styleUrl: './time-sheet-date-selector.component.scss',
  imports: [DatePipe, NgClass, NgbInputDatepicker],
})
export class TimeSheetDateSelectorComponent implements OnInit {
  public readonly layout = input<'default' | 'pill'>('default');
  public readonly weekChange = output<{ start: Date; end: Date }>();

  @ViewChild(NgbInputDatepicker)
  public datePicker?: NgbInputDatepicker;

  private lastClosedAt = 0;

  public readonly selectedWeekEnd = signal(new Date());
  public readonly selectedWeekStart = signal(new Date());
  public readonly isCurrentWeek = computed(() => {
    const newDate = new Date();
    newDate.setUTCHours(0, 0, 0, 0);
    return (
      newDate.getTime() >= this.selectedWeekStart().getTime() &&
      newDate.getTime() <= this.selectedWeekEnd().getTime()
    );
  });
  public readonly datePickerStart = computed<NgbDateStruct>(() => {
    const start = this.selectedWeekStart();
    return {
      year: start.getUTCFullYear(),
      month: start.getUTCMonth() + 1,
      day: start.getUTCDate(),
    };
  });
  public readonly selectedYear = computed(() =>
    this.selectedWeekStart().getFullYear(),
  );

  public ngOnInit(): void {
    this.initializeCurrentWeek();
  }

  public initializeCurrentWeek(): void {
    const today = new Date();
    this.navigateToWeek(today);
  }

  public previousWeek(): void {
    this.updateWeekRange(-7);
  }

  public nextWeek(): void {
    this.updateWeekRange(7);
  }

  private updateWeekRange(increment: number): void {
    let currentWeekStart = new Date(this.selectedWeekStart());
    let currentWeekEnd = new Date(this.selectedWeekEnd());
    currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + increment);
    currentWeekEnd.setUTCDate(currentWeekEnd.getUTCDate() + increment);
    this.selectedWeekStart.set(currentWeekStart);
    this.selectedWeekEnd.set(currentWeekEnd);
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

    this.selectedWeekStart.set(weekStart);
    this.selectedWeekEnd.set(weekEnd);
    this.emitWeekChange();
  }

  private emitWeekChange(): void {
    this.weekChange.emit({
      start: this.selectedWeekStart(),
      end: this.selectedWeekEnd(),
    });
  }

  public toggleDatePicker(): void {
    // The popup closes itself on outside clicks, which includes the trigger;
    // ignore the click that follows so it doesn't immediately reopen.
    if (Date.now() - this.lastClosedAt < 200) return;
    this.datePicker?.toggle();
  }

  public onPickerClosed(): void {
    this.lastClosedAt = Date.now();
  }

  public onDateSelected(date: NgbDateStruct): void {
    this.navigateToWeek(new Date(Date.UTC(date.year, date.month - 1, date.day)));
    this.datePicker?.close();
  }

  public dayClasses(date: NgbDateStruct): Record<string, boolean> {
    const time = Date.UTC(date.year, date.month - 1, date.day);
    const start = this.selectedWeekStart().getTime();
    const end = this.selectedWeekEnd().getTime();
    const now = new Date();
    return {
      'in-week': time >= start && time <= end,
      'week-start': time === start,
      'week-end': time === end,
      today:
        time === Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    };
  }
}
