import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

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
  userCategoryOptions,
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
    NgbTooltipModule,
    AnalyticsFiltersComponent,
    MetricCardComponent,
  ],
  templateUrl: './project-analytics.page.html',
  styleUrl: './project-analytics.page.scss',
})
export class ProjectAnalyticsPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private paramSubscription?: Subscription;
  private loadSeq = 0;
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

  /**
   * People the team member filter offers here: this project's members plus
   * anyone who has logged time on it, so an ex-member's hours stay reachable.
   * A user already selected in the filter is kept on the list even if they
   * match neither, so the dropdown reflects what is applied.
   */
  public readonly filterUsers = computed<User[]>(() => {
    const members = this.project()?.users ?? [];
    const contributorIds = this.entries().map((entry) => entry.userId);
    const relatedIds = new Set([
      ...members.map((member) => member.id),
      ...contributorIds,
    ]);
    if (!relatedIds.size) return this.users();

    const scoped = this.users().filter((user) => relatedIds.has(user.id));

    const selectedId = this.filter().userId;
    if (selectedId && !relatedIds.has(selectedId)) {
      const selected = this.usersById().get(selectedId);
      if (selected) return [...scoped, selected];
    }

    return scoped;
  });

  public readonly categories = computed(() => {
    const project = this.project();
    if (!project) return [];

    const userId = this.filter().userId;
    if (userId) return userCategoryOptions(this.entries(), userId);

    return categoryFilterOptions(this.entries(), [project], this.projectId());
  });

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
    void this.fetchUsers();
    this.paramSubscription = this.route.paramMap.subscribe((params) => {
      const id = params.get('projectId') ?? '';
      if (id === this.projectId()) return;
      this.projectId.set(id);
      this.resetForProject();
      void this.load();
    });
  }

  public ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }

  private resetForProject(): void {
    this.firstLoad = true;
    this.filter.set({});
    this.expanded.set(new Set());
    this.busy.set(new Set());
    this.entries.set([]);
  }

  public onFilterChange(filter: AnalyticsFilter): void {
    this.filter.set(filter);
    if (this.firstLoad && this.days().length) {
      this.firstLoad = false;
      this.expanded.set(new Set([this.days()[0].key]));
    }
  }

  private async load(): Promise<void> {
    const seq = ++this.loadSeq;
    this.loading.set(true);
    while (!this.store.projects.fetchedAt()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    try {
      const projectId = this.projectId();
      const entries = await this.entryService.findByProjectId([projectId]);
      if (seq !== this.loadSeq) return;
      this.entries.set(entries);
      if (this.days().length && !this.expanded().size) {
        this.expanded.set(new Set([this.days()[0].key]));
      }
      this.firstLoad = false;
    } catch {
      if (seq !== this.loadSeq) return;
      this.toast.error('Failed to fetch time sheet entries');
      this.entries.set([]);
    } finally {
      if (seq === this.loadSeq) {
        this.loading.set(false);
      }
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
    if (entry.approved === approved) return;
    await this.saveStatus([entry], approved);
  }

  public async approveDay(day: DayGroup): Promise<void> {
    await this.saveStatus(
      day.entries.filter((e) => !e.approved),
      true,
    );
  }

  public async declineDay(day: DayGroup): Promise<void> {
    await this.saveStatus(
      day.entries.filter((e) => e.approved),
      false,
    );
  }

  public isDayBusy(day: DayGroup): boolean {
    return day.entries.some((entry) => this.isBusy(entry.id));
  }

  private async saveStatus(
    entries: TimeSheetEntry[],
    approved: boolean,
  ): Promise<void> {
    if (!entries.length) return;
    this.busy.update((set) => new Set([...set, ...entries.map((e) => e.id)]));
    try {
      const results = await Promise.allSettled(
        entries.map(async (entry) => {
          const toSave = entry.clone();
          toSave.approved = approved;
          return this.entryService.save(toSave);
        }),
      );
      const saved = results
        .filter(
          (r): r is PromiseFulfilledResult<TimeSheetEntry> =>
            r.status === 'fulfilled',
        )
        .map((r) => r.value);
      const failedCount = results.length - saved.length;

      if (saved.length) {
        const byId = new Map(saved.map((e) => [e.id, e]));
        this.entries.update((list) =>
          list.map((e) => byId.get(e.id) ?? e),
        );
      }

      if (failedCount) {
        await this.reloadEntriesAfterStatusError();
        const total = entries.length;
        this.toast.error(
          failedCount === total
            ? 'Error updating time entry status'
            : `${failedCount} of ${total} time entries could not be updated. List refreshed from server.`,
        );
        return;
      }

      this.toast.success(
        approved ? 'Time entries approved' : 'Time entries declined',
      );
    } finally {
      this.busy.update((set) => {
        const next = new Set(set);
        entries.forEach((e) => next.delete(e.id));
        return next;
      });
    }
  }

  private async reloadEntriesAfterStatusError(): Promise<void> {
    try {
      const fresh = await this.entryService.findByProjectId([this.projectId()]);
      this.entries.set(fresh);
    } catch {
      this.toast.error('Failed to refresh time sheet entries');
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
