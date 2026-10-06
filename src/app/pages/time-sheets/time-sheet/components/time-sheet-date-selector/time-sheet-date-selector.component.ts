import { DatePipe, NgClass } from '@angular/common';
import {
  Component,
  ElementRef,
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

const DAY_MS = 86_400_000;

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

  @ViewChild('pickerTarget')
  public pickerTarget?: ElementRef<HTMLElement>;

  private readonly hoveredDay = signal<number | null>(null);

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
    const picker = this.datePicker;
    if (!picker) return;
    if (this.pickerTarget) {
      picker.positionTarget = this.pickerTarget.nativeElement;
    }
    picker.toggle();
  }

  public onPickerClosed(): void {
    this.hoveredDay.set(null);
  }

  public onDayHover(date: NgbDateStruct | null): void {
    this.hoveredDay.set(
      date ? Date.UTC(date.year, date.month - 1, date.day) : null,
    );
  }

  public onDateSelected(date: NgbDateStruct): void {
    this.navigateToWeek(new Date(Date.UTC(date.year, date.month - 1, date.day)));
    this.datePicker?.close();
  }

  /** Space-separated classes for one calendar day cell. */
  public dayClasses(date: NgbDateStruct): string {
    const time = Date.UTC(date.year, date.month - 1, date.day);
    const { start, end, today, hoverStart } = this.highlight();
    const classes: string[] = [];
    if (time >= start && time <= end) classes.push('in-week');
    if (time === start) classes.push('week-start');
    if (time === end) classes.push('week-end');
    if (time === today) classes.push('today');
    if (
      hoverStart !== null &&
      time >= hoverStart &&
      time <= hoverStart + 6 * DAY_MS
    ) {
      classes.push('hover-week');
    }
    return classes.join(' ');
  }

  private readonly highlight = computed(() => {
    const hovered = this.hoveredDay();
    const now = new Date();
    return {
      start: this.selectedWeekStart().getTime(),
      end: this.selectedWeekEnd().getTime(),
      today: Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
      hoverStart:
        hovered === null
          ? null
          : hovered - ((new Date(hovered).getUTCDay() + 6) % 7) * DAY_MS,
    };
  });
}
