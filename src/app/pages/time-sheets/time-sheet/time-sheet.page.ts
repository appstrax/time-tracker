import { Store } from '@state';
import { Project } from '@models';
import { Component, effect, OnInit, Signal } from '@angular/core';
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

  public isLoading: boolean = true;
  public isLoadingEntries: boolean = true;

  public timeSheetEntries: TimeSheetEntry[] = [];
  public categoryColors: Map<string, string> = new Map<string, string>();

  constructor(
    private store: Store,
    private toastService: ToastService,
    private timeSheetEntryService: TimeSheetEntryService,
  ) {
    this.projects = this.store.projects.all;
    let projects = this.projects();
    effect(() => {
      if (projects.length !== this.projects().length) {
        projects = this.projects();
        this.ngOnInit();
      }
    });
  }

  public async ngOnInit(): Promise<void> {
    if (!this.projects().length) return;
    this.isLoading = true;

    const user = await appstraxAuth.getUser();
    if (!user) return;
    this.user = user;
    await this.initializeTimeSheetEntries();

    this.isLoading = false;
  }

  public async initializeTimeSheetEntries(): Promise<void> {
    this.isLoadingEntries = true;
    await this.fetchTimeSheetEntries();
    this.initializeCategoryColors();
    this.isLoadingEntries = false;
  }

  public async onTimeSheetEntrySaved(entry: TimeSheetEntry | undefined): Promise<void> {
    await this.initializeTimeSheetEntries();
  }

  private async fetchTimeSheetEntries(): Promise<void> {
    if (!this.user?.id) return;
    try {
      const monthStart = new Date(this.currentWeekStart);
      monthStart.setUTCDate(this.currentWeekStart.getUTCDate() - 21);
      monthStart.setUTCHours(0, 0, 0, 0);

      const monthEnd = new Date(this.currentWeekEnd);
      monthEnd.setUTCDate(this.currentWeekEnd.getUTCDate() + 21);
      monthEnd.setUTCHours(23, 59, 59, 999);

      this.timeSheetEntries = await this.timeSheetEntryService.getTimeSheetEntriesByUserIdAndDateRange(
        this.user.id,
        monthStart,
        monthEnd
      );
    } catch (error) {
      this.toastService.error('Error initializing time sheet entries');
    }
  }

  private initializeCategoryColors(): void {
    const categories = this.getTimeSheetCategories();
    for (let i = 0; i < categories.length; i++) {
      this.categoryColors.set(categories[i], ColorList.colors[i]);
    }
  }

  public async onWeekChange(weekRange: { start: Date; end: Date }): Promise<void> {
    this.currentWeekStart = weekRange.start;
    this.currentWeekEnd = weekRange.end;
    this.updateWeekDays();
    await this.initializeTimeSheetEntries();
  }

  private updateWeekDays(): void {
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setUTCDate(this.currentWeekStart.getUTCDate() + i);
      this.weekDays.push(date);
    }
  }

  public filterEntriesByDate(date: Date): TimeSheetEntry[] {
    return this.timeSheetEntries.filter(
      entry => entry.date.toDateString() === date.toDateString(),
    );
  }

  public getTimeSheetCategories(): string[] {
    return [...new Set(this.timeSheetEntries.map(entry => entry.category))];
  }
}
