import { Component, computed, signal } from '@angular/core';

import { TimeSheetEntry } from '@models';
import { ToastService, TimeSheetEntryService } from '@services';
import { Store } from '@state';
import { ColorList } from '@utils';

import { TimeSheetDayComponent } from './components';
import { TimeSheetDateSelectorComponent } from './components';

@Component({
  standalone: true,
  templateUrl: './time-sheet.page.html',
  styleUrl: './time-sheet.page.scss',
  imports: [TimeSheetDayComponent, TimeSheetDateSelectorComponent],
})
export class TimeSheetPage {
  private readonly weekStart = signal(new Date());
  private readonly weekEnd = signal(new Date());

  public readonly projects = computed(() => this.store.projects.projects());

  public readonly weekDays = computed(() => {
    const weekStart = this.weekStart();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setUTCDate(weekStart.getUTCDate() + index);
      return date;
    });
  });

  public readonly fetching = signal(false);
  public readonly loading = computed(
    () => this.fetching() || !this.store.projects.fetchedAt(),
  );

  private readonly entries = signal<TimeSheetEntry[]>([]);
  public readonly categories = computed(() => [
    ...new Set(this.entries().map((entry) => entry.category)),
  ]);
  public readonly colors = computed(() => {
    const colors = new Map<string, string>();
    this.categories().forEach((category, index) => {
      colors.set(
        category,
        ColorList.colors[index % ColorList.colors.length] ?? '#6B7280',
      );
    });
    return colors;
  });
  public readonly entriesByDate = computed(() => {
    const entriesByDate = new Map<string, TimeSheetEntry[]>();
    for (const entry of this.entries()) {
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
    private entryService: TimeSheetEntryService,
  ) {}

  private async waitForProjects(): Promise<void> {
    if (this.store.projects.fetchedAt()) return;
    while (true) {
      if (this.store.projects.fetchedAt()) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  public onTimeSheetEntrySaved() {
    this.fetchTimeSheetEntries();
  }

  private async fetchTimeSheetEntries(): Promise<void> {
    this.fetching.set(true);

    await this.waitForProjects();
    if (!this.projects().length) {
      this.fetching.set(false);
      return;
    }

    const user = this.store.user.user();
    if (!user) return;

    try {
      const start = this.weekStart();
      const end = this.weekEnd();

      const entries = await this.entryService.findByUserAndDateRange(
        user.id,
        start,
        end,
      );

      this.entries.set(entries);
    } catch (error) {
      this.toastService.error('Error initializing time sheet entries');
    } finally {
      this.fetching.set(false);
    }
  }

  public onWeekChange(range: { start: Date; end: Date }) {
    this.weekStart.set(range.start);
    this.weekEnd.set(range.end);

    this.fetchTimeSheetEntries();
  }
}
