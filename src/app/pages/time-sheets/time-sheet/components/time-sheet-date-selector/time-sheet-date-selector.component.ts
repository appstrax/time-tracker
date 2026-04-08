import { DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-time-sheet-date-selector',
  standalone: true,
  templateUrl: './time-sheet-date-selector.component.html',
  styleUrl: './time-sheet-date-selector.component.scss',
  imports: [DatePipe],
})
export class TimeSheetDateSelectorComponent implements OnInit {
  public readonly weekChange = output<{ start: Date; end: Date }>();

  @ViewChild('datePicker')
  public datePicker?: ElementRef<HTMLInputElement>;

  private readonly maxDate = signal(new Date());
  public readonly selectedWeekEnd = signal(new Date());
  public readonly selectedWeekStart = signal(new Date());
  public readonly canGoToNextWeek = computed(() => {
    const nextWeekStart = new Date(this.selectedWeekStart());
    nextWeekStart.setUTCDate(this.selectedWeekStart().getUTCDate() + 7);
    return nextWeekStart.getTime() <= this.maxDate().getTime();
  });
  public readonly isCurrentWeek = computed(() => {
    const newDate = new Date();
    newDate.setUTCHours(0, 0, 0, 0);
    return (
      newDate.getTime() >= this.selectedWeekStart().getTime() &&
      newDate.getTime() <= this.selectedWeekEnd().getTime()
    );
  });
  public readonly datePickerValue = computed(() => {
    const selectedWeekStart = this.selectedWeekStart();
    const year = selectedWeekStart.getUTCFullYear();
    const month = String(selectedWeekStart.getUTCMonth() + 1).padStart(2, '0');
    const day = String(selectedWeekStart.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  public readonly selectedYear = computed(() =>
    this.selectedWeekStart().getFullYear(),
  );

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

    const maxDate = new Date(today);
    maxDate.setUTCDate(today.getUTCDate() + diff);
    maxDate.setUTCHours(0, 0, 0, 0);
    this.maxDate.set(maxDate);
  }

  public previousWeek(): void {
    this.updateWeekRange(-7);
  }

  public nextWeek(): void {
    if (this.canGoToNextWeek()) {
      this.updateWeekRange(7);
    }
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

    if (weekStart.getTime() > this.maxDate().getTime()) {
      const today = new Date();
      this.navigateToWeek(today);
    } else {
      this.selectedWeekStart.set(weekStart);
      this.selectedWeekEnd.set(weekEnd);
    }
    this.emitWeekChange();
  }

  private emitWeekChange(): void {
    this.weekChange.emit({
      start: this.selectedWeekStart(),
      end: this.selectedWeekEnd(),
    });
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

  public onDateSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      const selectedDate = new Date(input.value);
      this.navigateToWeek(selectedDate);
    }
  }
}
