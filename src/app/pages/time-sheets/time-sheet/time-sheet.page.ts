import { Component, computed, signal } from '@angular/core';

import { ProjectDropdownComponent } from '@components';
import { Project, TimeSheetEntry } from '@models';
import { ToastService, TimeSheetEntryService } from '@services';
import { Store } from '@state';
import {
  buildProjectColorMap,
  clearStoredTimeSheetFilterProjectId,
  getStoredTimeSheetFilterProjectId,
  localCalendarDayKey,
  storeTimeSheetFilterProjectId,
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
  public readonly localCalendarDayKey = localCalendarDayKey;

  private readonly weekStart = signal(new Date());
  private readonly weekEnd = signal(new Date());
  private readonly filterProjectId = signal<string | null>(
    getStoredTimeSheetFilterProjectId(),
  );

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

  public readonly weekEntries = signal<TimeSheetEntry[]>([]);
  private readonly filteredEntries = computed(() => {
    const projectId = this.filterProjectId();
    const entries = this.weekEntries();
    if (!projectId) return entries;
    return entries.filter((entry) => entry.projectId === projectId);
  });

  public readonly entriesByDate = computed(() => {
    const entriesByDate = new Map<string, TimeSheetEntry[]>();
    for (const entry of this.filteredEntries()) {
      const dateKey = localCalendarDayKey(entry.date);
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

  public onTimeSheetEntrySaved(entry?: TimeSheetEntry) {
    this.adoptSavedEntryProjectFilter(entry);
    this.fetchTimeSheetEntries();
  }

  /** After saving an entry, follow it into the filter — but only when a specific
   * project was already selected. "All projects" stays "all projects". */
  private adoptSavedEntryProjectFilter(entry?: TimeSheetEntry): void {
    if (this.filterProjectId() === null) return;

    const projectId = entry?.projectId;
    if (!projectId) return;

    this.filterProjectId.set(projectId);
    storeTimeSheetFilterProjectId(projectId);
  }

  public onFilterProjectSelected(project: Project | null): void {
    this.filterProjectId.set(project?.id ?? null);
    if (project?.id) {
      storeTimeSheetFilterProjectId(project.id);
    } else {
      clearStoredTimeSheetFilterProjectId();
    }
  }

  /** Re-validates the active filter against the loaded projects; never pulls in the
   * modal's "last used project" so saving an entry can't silently change the filter. */
  private syncFilterProject(): void {
    const projectId = this.filterProjectId();
    if (!projectId) return;

    const project = this.projects().find((item) => item.id === projectId);
    if (!project) {
      this.filterProjectId.set(null);
      clearStoredTimeSheetFilterProjectId();
    }
  }

  private async fetchTimeSheetEntries(): Promise<void> {
    this.fetching.set(true);

    await this.waitForProjects();
    this.syncFilterProject();

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

      this.weekEntries.set(entries);
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
