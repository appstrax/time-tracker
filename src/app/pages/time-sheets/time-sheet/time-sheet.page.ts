import { Store } from '@state';
import { Project } from '@models';
import { Component, OnInit, Signal } from '@angular/core';
import { appstraxAuth, User } from '@appstrax/services/auth';

import { TimeSheetEntry } from '@models';
import { ToastService, TimeSheetEntryService } from '@services';
import { ColorList } from 'src/app/utils/color-list';

import { TimeSheetDayComponent } from './components/time-sheet-day/time-sheet-day.component';
import { TimeSheetDateSelectorComponent } from './components/time-sheet-date-selector/time-sheet-date-selector.component';

@Component({
  selector: 'app-time-sheet',
  standalone: true,
  templateUrl: './time-sheet.page.html',
  styleUrl: './time-sheet.page.scss',
  imports: [TimeSheetDayComponent, TimeSheetDateSelectorComponent]
})
export class TimeSheetPage implements OnInit {
  private user: User | null = null;

  private currentWeekStart: Date = new Date();
  private currentWeekEnd: Date = new Date();

  public projects: Signal<Project[]>;

  public weekDays: Date[] = [];
  public timeSheetEntries: TimeSheetEntry[] = [];
  public categoryColors: Map<string, string> = new Map<string, string>();

  constructor(
    private store: Store,
    private toastService: ToastService,
    private timeSheetEntryService: TimeSheetEntryService,
  ) {
    this.projects = this.store.projects.all;
  }

  async ngOnInit(): Promise<void> {
    const user = await appstraxAuth.getUser();
    if (!user) return;
    this.user = user;
    this.initializeWeekDays();
    await this.initializeTimeSheetEntries();
    this.initializeCategoryColors();
  }

  initializeWeekDays(): void {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setUTCDate(today.getUTCDate() + diff);
    this.currentWeekStart.setUTCHours(0, 0, 0, 0);

    this.currentWeekEnd = new Date(this.currentWeekStart);
    this.currentWeekEnd.setUTCDate(this.currentWeekStart.getUTCDate() + 6);
    this.currentWeekEnd.setUTCHours(23, 59, 59, 999);

    this.updateWeekDays();
  }

  async onTimeSheetEntrySaved(entry: TimeSheetEntry): Promise<void> {
    await this.initializeTimeSheetEntries();
    this.initializeCategoryColors();
  }

  async initializeTimeSheetEntries(): Promise<void> {
    if (!this.user?.id) return;
    try {
      this.timeSheetEntries = await this.timeSheetEntryService.getTimeSheetEntriesByUserId(this.user.id);
    } catch (error) {
      this.toastService.error('Error initializing time sheet entries');
    }
  }

  initializeCategoryColors(): void {
    const categories = this.getTimeSheetCategories();
    for (let i = 0; i < categories.length; i++) {
      this.categoryColors.set(categories[i], ColorList.colors[i]);
    }
  }

  onWeekChange(weekRange: { start: Date; end: Date }): void {
    this.currentWeekStart = weekRange.start;
    this.currentWeekEnd = weekRange.end;
    this.updateWeekDays();
  }

  updateWeekDays(): void {
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setUTCDate(this.currentWeekStart.getUTCDate() + i);
      this.weekDays.push(date);
    }
  }

  filterEntriesByDate(date: Date): TimeSheetEntry[] {
    let filteredEntries: TimeSheetEntry[] = this.timeSheetEntries.filter(
      entry => entry.date.toDateString() === date.toDateString(),
    );
    return filteredEntries;
  }

  getTimeSheetCategories(): string[] {
    return [...new Set(this.timeSheetEntries.map(entry => entry.category))];
  }
}
