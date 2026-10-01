import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AnalyticsFilter, Project, TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, ToastService, UsersService } from '@services';
import { Store } from '@state';
import {
  TimeSheetExportUtil,
  buildProjectColorMap,
  categoryFilterOptions,
  getUserDisplayName,
} from '@utils';

import {
  filterAnalyticsEntries,
  formatDateInput,
} from '../analytics-filter.util';
import { AnalyticsFiltersComponent, MetricCardComponent } from '../components';

interface DayGroup {
  key: string;
  date: Date;
  entries: TimeSheetEntry[];
  total: number;
  pending: number;
  allApproved: boolean;
}

const localDayKey = (date: Date): string => {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

@Component({
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    AnalyticsFiltersComponent,
    MetricCardComponent,
  ],
  templateUrl: './project-analytics.page.html',
  styleUrl: './project-analytics.page.scss',
})
export class ProjectAnalyticsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly entryService = inject(TimeSheetEntryService);
  private readonly toast = inject(ToastService);
  private readonly usersService = inject(UsersService);
  private readonly exportUtil = inject(TimeSheetExportUtil);

  public readonly loading = signal(true);
  public readonly projectId = signal('');
  public readonly entries = signal<TimeSheetEntry[]>([]);
  public readonly users = signal<User[]>([]);
  public readonly filter = signal<AnalyticsFilter>({});
  public readonly expanded = signal<Set<string>>(new Set());
  public readonly busy = signal<Set<string>>(new Set());

  private firstLoad = true;

  public readonly project = computed<Project | null>(
    () => this.store.projects.projects().find((p) => p.id === this.projectId()) ?? null,
  );

  public readonly color = computed(() => {
    const project = this.project();
    if (!project) return 'var(--color-primary)';
    return (
      buildProjectColorMap(this.store.projects.projects()).get(project.id) ??
      'var(--color-primary)'
    );
  });

  public readonly usersById = computed(
    () => new Map(this.users().map((u) => [u.id, u])),
  );

  public readonly categories = computed(() =>
    this.project()
      ? categoryFilterOptions(this.entries(), [this.project()!], this.projectId())
      : [],
  );

  public readonly filteredEntries = computed(() =>
    filterAnalyticsEntries(this.entries(), this.filter()),
  );

  public readonly days = computed<DayGroup[]>(() => {
    const groups = new Map<string, DayGroup>();
    for (const entry of this.filteredEntries()) {
      const key = localDayKey(entry.date);
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          date: new Date(entry.date),
          entries: [],
          total: 0,
          pending: 0,
          allApproved: true,
        };
        groups.set(key, group);
      }
      group.entries.push(entry);
      group.total += entry.hours || 0;
      if (!entry.approved) {
        group.pending += 1;
        group.allApproved = false;
      }
    }
    return [...groups.values()].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  });

  public readonly totals = computed(() => {
    const entries = this.filteredEntries();
    const sum = (list: TimeSheetEntry[]) =>
      list.reduce((s, e) => s + (e.hours || 0), 0);
    const total = sum(entries);
    const dayCount = this.days().length;
    return {
      total,
      approved: sum(entries.filter((e) => e.approved)),
      pending: sum(entries.filter((e) => !e.approved)),
      pendingCount: entries.filter((e) => !e.approved).length,
      average: dayCount ? total / dayCount : 0,
      dayCount,
      contributors: new Set(entries.map((e) => e.userId)).size,
    };
  });

  public readonly allExpanded = computed(
    () => this.days().length > 0 && this.days().every((d) => this.expanded().has(d.key)),
  );

  public ngOnInit(): void {
    this.projectId.set(this.route.snapshot.paramMap.get('projectId') ?? '');
    this.load();
    this.fetchUsers();
  }

  public onFilterChange(filter: AnalyticsFilter): void {
    this.filter.set(filter);
    if (this.firstLoad && this.days().length) {
      this.firstLoad = false;
      this.expanded.set(new Set([this.days()[0].key]));
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    while (!this.store.projects.fetchedAt()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    try {
      const entries = await this.entryService.findByProjectId([
        this.projectId(),
      ]);
      this.entries.set(entries);
      if (this.days().length && !this.expanded().size) {
        this.expanded.set(new Set([this.days()[0].key]));
      }
      this.firstLoad = false;
    } catch {
      this.toast.error('Failed to fetch time sheet entries');
      this.entries.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async fetchUsers(): Promise<void> {
    try {
      this.users.set(await this.usersService.fetchUsers());
    } catch {
      this.toast.error('Failed to fetch users');
    }
  }

  public userName(userId: string): string {
    return getUserDisplayName(this.usersById().get(userId) ?? null);
  }

  public userInitials(userId: string): string {
    return (
      this.userName(userId)
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?'
    );
  }

  public toggleDay(key: string): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  public toggleAll(): void {
    this.expanded.set(
      this.allExpanded() ? new Set() : new Set(this.days().map((d) => d.key)),
    );
  }

  public isBusy(id: string): boolean {
    return this.busy().has(id);
  }

  public async setApproved(entry: TimeSheetEntry, approved: boolean): Promise<void> {
    await this.saveStatus([entry], approved);
  }

  public async approveDay(day: DayGroup): Promise<void> {
    await this.saveStatus(
      day.entries.filter((e) => !e.approved),
      true,
    );
  }

  private async saveStatus(
    entries: TimeSheetEntry[],
    approved: boolean,
  ): Promise<void> {
    if (!entries.length) return;
    this.busy.update((set) => new Set([...set, ...entries.map((e) => e.id)]));
    try {
      for (const entry of entries) {
        const toSave = entry.clone();
        toSave.approved = approved;
        const saved = await this.entryService.save(toSave);
        this.entries.update((list) =>
          list.map((e) => (e.id === saved.id ? saved : e)),
        );
      }
      this.toast.success(
        approved ? 'Time entries approved' : 'Time entry marked pending',
      );
    } catch {
      this.toast.error('Error updating time entry status');
    } finally {
      this.busy.update((set) => {
        const next = new Set(set);
        entries.forEach((e) => next.delete(e.id));
        return next;
      });
    }
  }

  public exportProject(): void {
    const entries = this.filteredEntries();
    if (!entries.length) {
      this.toast.info('No entries to export for the current filters.');
      return;
    }
    this.exportUtil.exportProjectEntries(
      this.projectId(),
      entries,
      this.store.projects.projects(),
      this.users(),
      formatDateInput,
    );
  }
}
