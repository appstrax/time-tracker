import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TimeSheetEntry } from 'src/app/models/time-sheet-entry.model';

@Component({
  selector: 'app-time-sheet-date-selector',
  standalone: true,
  templateUrl: './time-sheet-date-selector.component.html',
  styleUrl: './time-sheet-date-selector.component.scss'
})
export class TimeSheetDateSelectorComponent implements OnInit, OnChanges {
  @Input() timeSheetEntries: TimeSheetEntry[] = [];
  @Output() weekChange = new EventEmitter<{ start: Date; end: Date }>();

  public currentWeekStart: Date = new Date();
  public currentWeekEnd: Date = new Date();
  private availableWeeks: Set<string> = new Set();
  private availableWeeksList: Date[] = [];
  private currentWeekIndex: number = -1;

  ngOnInit(): void {
    this.initializeCurrentWeek();
    this.calculateAvailableWeeks();
    this.ensureCurrentWeekIsAvailable();
    this.emitWeekChange();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeSheetEntries'] && !changes['timeSheetEntries'].firstChange) {
      this.calculateAvailableWeeks();
      this.ensureCurrentWeekIsAvailable();
    }
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

  calculateAvailableWeeks(numberOfWeeks: number = 3): void {
    this.availableWeeks.clear();
    const weeksSet = new Set<string>();
    const weeksList: Date[] = [];
    const today = new Date();

    const dayOfWeek = today.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    for (let i = 0; i < numberOfWeeks; i++) {
      const weekStart = new Date(today);
      weekStart.setUTCDate(today.getUTCDate() + diff - (i * 7));
      weekStart.setUTCHours(0, 0, 0, 0);
      const weekKey = this.getWeekKey(weekStart);
      if (!weeksSet.has(weekKey)) {
        weeksSet.add(weekKey);
        weeksList.push(weekStart);
      }
    }

    this.timeSheetEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const entryDayOfWeek = entryDate.getUTCDay();
      const entryDiff = entryDayOfWeek === 0 ? -6 : 1 - entryDayOfWeek;

      const entryWeekStart = new Date(entryDate);
      entryWeekStart.setUTCDate(entryDate.getUTCDate() + entryDiff);
      entryWeekStart.setUTCHours(0, 0, 0, 0);

      const weekKey = this.getWeekKey(entryWeekStart);
      if (!weeksSet.has(weekKey)) {
        weeksSet.add(weekKey);
        weeksList.push(entryWeekStart);
      }
    });

    weeksList.sort((a, b) => a.getTime() - b.getTime());

    this.availableWeeks = weeksSet;
    this.availableWeeksList = weeksList;
    this.updateCurrentWeekIndex();
  }

  getWeekKey(weekStart: Date): string {
    const year = weekStart.getUTCFullYear();
    const month = String(weekStart.getUTCMonth() + 1).padStart(2, '0'); // getUTCMonth() is 0-indexed, so add 1
    const date = String(weekStart.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  isWeekAvailable(weekStart: Date): boolean {
    return this.availableWeeks.has(this.getWeekKey(weekStart));
  }

  ensureCurrentWeekIsAvailable(): void {
    if (!this.isWeekAvailable(this.currentWeekStart)) {
      const nearestWeek = this.findNearestAvailableWeek(this.currentWeekStart);
      if (nearestWeek) {
        this.currentWeekStart = nearestWeek;
        this.currentWeekEnd = new Date(this.currentWeekStart);
        this.currentWeekEnd.setUTCDate(this.currentWeekStart.getUTCDate() + 6);
        this.currentWeekEnd.setUTCHours(0, 0, 0, 0);
        this.updateCurrentWeekIndex();
      }
    } else {
      this.updateCurrentWeekIndex();
    }
  }

  updateCurrentWeekIndex(): void {
    const currentWeekKey = this.getWeekKey(this.currentWeekStart);
    this.currentWeekIndex = this.availableWeeksList.findIndex(week =>
      this.getWeekKey(week) === currentWeekKey
    );
  }

  findNearestAvailableWeek(fromWeek: Date): Date | null {
    if (this.availableWeeksList.length === 0) {
      return null;
    }
    const fromTime = fromWeek.getTime();
    let nearestWeek: Date | null = null;
    let minDiff = Infinity;
    for (const week of this.availableWeeksList) {
      const diff = Math.abs(week.getTime() - fromTime);
      if (diff < minDiff) {
        minDiff = diff;
        nearestWeek = week;
      }
    }
    return nearestWeek ? new Date(nearestWeek) : null;
  }

  previousWeek(): void {
    if (this.canGoToPreviousWeek()) {
      this.currentWeekIndex--;
      const previousWeek = this.availableWeeksList[this.currentWeekIndex];
      this.currentWeekStart = new Date(previousWeek);
      this.currentWeekEnd = new Date(this.currentWeekStart);
      this.currentWeekEnd.setUTCDate(this.currentWeekStart.getUTCDate() + 6);
      this.currentWeekEnd.setUTCHours(0, 0, 0, 0);
      this.emitWeekChange();
    }
  }

  nextWeek(): void {
    if (this.canGoToNextWeek()) {
      this.currentWeekIndex++;
      const nextWeek = this.availableWeeksList[this.currentWeekIndex];
      this.currentWeekStart = new Date(nextWeek);
      this.currentWeekEnd = new Date(this.currentWeekStart);
      this.currentWeekEnd.setUTCDate(this.currentWeekStart.getUTCDate() + 6);
      this.currentWeekEnd.setUTCHours(0, 0, 0, 0);
      this.emitWeekChange();
    }
  }

  canGoToPreviousWeek(): boolean {
    return this.currentWeekIndex > 0;
  }

  canGoToNextWeek(): boolean {
    return this.currentWeekIndex >= 0 && this.currentWeekIndex < this.availableWeeksList.length - 1;
  }

  goToCurrentWeek(): void {
    this.initializeCurrentWeek();
    this.updateCurrentWeekIndex();
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
}
