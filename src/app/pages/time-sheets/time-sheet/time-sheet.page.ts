import { Component, computed, OnInit, signal } from '@angular/core';
import { appstraxAuth, User } from '@appstrax/services/auth';

import { TimeSheetEntry } from '@models';
import { ToastService, TimeSheetEntryService } from '@services';
import { Store } from '@state';
import { ColorList } from '@utils';

import { TimeSheetDayComponent } from './components/time-sheet-day/time-sheet-day.component';
import { TimeSheetDateSelectorComponent } from './components/time-sheet-date-selector/time-sheet-date-selector.component';

@Component({
  selector: 'app-time-sheet',
  standalone: true,
  templateUrl: './time-sheet.page.html',
  styleUrl: './time-sheet.page.scss',
  imports: [
    TimeSheetDayComponent,
    TimeSheetDateSelectorComponent,
  ],
})
export class TimeSheetPage implements OnInit {
  private readonly user = signal<User | null>(null);

  private readonly currentWeekStart = signal(new Date());
  private readonly currentWeekEnd = signal(new Date());

  public readonly projects = computed(() => this.store.projects.projects());

  public readonly weekDays = computed(() => {
    const currentWeekStart = this.currentWeekStart();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(currentWeekStart);
      date.setUTCDate(currentWeekStart.getUTCDate() + index);
      return date;
    });
  });

  public readonly isLoading = signal(true);
  public readonly isLoadingEntries = signal(true);
  public readonly isSheetLoading = computed(
    () => this.isLoading() || this.isLoadingEntries(),
  );

  private readonly timeSheetEntries = signal<TimeSheetEntry[]>([]);
  public readonly timeSheetCategories = computed(() => [
    ...new Set(this.timeSheetEntries().map((entry) => entry.category)),
  ]);
  public readonly categoryColors = computed(() => {
    const colors = new Map<string, string>();
    this.timeSheetCategories().forEach((category, index) => {
      colors.set(
        category,
        ColorList.colors[index % ColorList.colors.length] ?? '#6B7280',
      );
    });
    return colors;
  });
  public readonly entriesByDate = computed(() => {
    const entriesByDate = new Map<string, TimeSheetEntry[]>();
    for (const entry of this.timeSheetEntries()) {
      const dateKey = entry.date.toDateString();
      const entries = entriesByDate.get(dateKey) ?? [];
      entries.push(entry);
      entriesByDate.set(dateKey, entries);
    }
    return entriesByDate;
  });

  constructor(
    private store: Store,
    private toastService: ToastService,
    private timeSheetEntryService: TimeSheetEntryService,
  ) {}

  public async ngOnInit(): Promise<void> {
    if (!this.projects().length) return;
    this.isLoading.set(true);

    const user = await appstraxAuth.getUser();
    if (!user) return;
    this.user.set(user);
    await this.initializeTimeSheetEntries();

    this.isLoading.set(false);
  }

  public async initializeTimeSheetEntries(): Promise<void> {
    this.isLoadingEntries.set(true);
    await this.fetchTimeSheetEntries();
    this.isLoadingEntries.set(false);
  }

  public async onTimeSheetEntrySaved(
    _entry: TimeSheetEntry | undefined,
  ): Promise<void> {
    await this.initializeTimeSheetEntries();
  }

  private async fetchTimeSheetEntries(): Promise<void> {
    const user = this.user();
    if (!user?.id) return;

    try {
      const currentWeekStart = this.currentWeekStart();
      const currentWeekEnd = this.currentWeekEnd();
      const monthStart = new Date(currentWeekStart);
      monthStart.setUTCDate(currentWeekStart.getUTCDate() - 21);
      monthStart.setUTCHours(0, 0, 0, 0);

      const monthEnd = new Date(currentWeekEnd);
      monthEnd.setUTCDate(currentWeekEnd.getUTCDate() + 21);
      monthEnd.setUTCHours(23, 59, 59, 999);

      this.timeSheetEntries.set(
        await this.timeSheetEntryService.getTimeSheetEntriesByUserIdAndDateRange(
          user.id,
          monthStart,
          monthEnd,
        ),
      );
    } catch (error) {
      this.toastService.error('Error initializing time sheet entries');
    }
  }

  public async onWeekChange(weekRange: {
    start: Date;
    end: Date;
  }): Promise<void> {
    this.currentWeekStart.set(weekRange.start);
    this.currentWeekEnd.set(weekRange.end);
    await this.initializeTimeSheetEntries();
  }
}
