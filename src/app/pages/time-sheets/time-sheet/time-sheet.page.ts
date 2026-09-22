import { Component, computed, inject, signal } from '@angular/core';

import { ProjectDropdownComponent } from '@components';
import { Project, TimeSheetEntry } from '@models';
import { ToastService, TimeSheetEntryService } from '@services';
import { Store } from '@state';
import {
  buildProjectColorMap,
  clearStoredTimeSheetProjectId,
  storeTimeSheetProjectId,
} from '@utils';

import { TimeSheetDayComponent } from './components';
import { TimeSheetDateSelectorComponent } from './components';

@Component({
  standalone: true,
  templateUrl: './time-sheet.page.html',
  styleUrl: './time-sheet.page.scss',
  imports: [
    TimeSheetDayComponent,
    TimeSheetDateSelectorComponent,
    ProjectDropdownComponent,
  ],
})
export class TimeSheetPage {
  private readonly weekStart = signal(new Date());
  private readonly weekEnd = signal(new Date());
  private readonly filterProjectId = signal<string | null>(null);

  public readonly projects = computed(() => this.store.projects.projects());
  public readonly filterProject = computed(() => {
    const projectId = this.filterProjectId();
    if (!projectId) return null;
    return this.projects().find((project) => project.id === projectId) ?? null;
  });

  public readonly projectColorById = computed(() =>
    buildProjectColorMap(this.projects()),
  );

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
  private readonly filteredEntries = computed(() => {
    const projectId = this.filterProjectId();
    const entries = this.entries();
    if (!projectId) return entries;
    return entries.filter((entry) => entry.projectId === projectId);
  });

  public readonly categories = computed(() => [
    ...new Set(this.filteredEntries().map((entry) => entry.category)),
  ]);

  public readonly entriesByDate = computed(() => {
    const entriesByDate = new Map<string, TimeSheetEntry[]>();
    for (const entry of this.filteredEntries()) {
      const dateKey = entry.date.toDateString();
      const dayEntries = entriesByDate.get(dateKey) ?? [];
      dayEntries.push(entry);
      entriesByDate.set(dateKey, dayEntries);
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

  public onFilterProjectSelected(project: Project | null): void {
    this.filterProjectId.set(project?.id ?? null);
    if (project?.id) {
      storeTimeSheetProjectId(project.id);
    } else {
      clearStoredTimeSheetProjectId();
    }
  }

  private async fetchTimeSheetEntries(): Promise<void> {
    this.fetching.set(true);

    await this.waitForProjects();

    const user = this.store.user.user();
    if (!user) {
      this.fetching.set(false);
      return;
    }

    try {
      const start = this.weekStart();
      const end = this.weekEnd();

      const entries = await this.entryService.findByUserAndDateRange(
        user.id,
        start,
        end,
      );

      this.entries.set(entries);
    } catch {
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
