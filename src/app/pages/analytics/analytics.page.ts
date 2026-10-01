import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AnalyticsFilter, TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, ToastService, UsersService } from '@services';
import { Store } from '@state';
import {
  TimeSheetExportUtil,
  buildProjectColorMap,
  getUserDisplayName,
} from '@utils';

import { filterAnalyticsEntries, formatDateInput } from './analytics-filter.util';
import {
  AnalyticsFiltersComponent,
  InsightsChartsComponent,
  MetricCardComponent,
} from './components';

interface ProjectRow {
  id: string;
  name: string;
  description: string;
  color: string;
  hours: number;
  approved: number;
  pending: number;
  approvedPercent: number;
  contributors: string[];
  contributorCount: number;
  lastActivity: Date | null;
}

@Component({
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    AnalyticsFiltersComponent,
    InsightsChartsComponent,
    MetricCardComponent,
  ],
  templateUrl: './analytics.page.html',
  styleUrl: './analytics.page.scss',
})
export class AnalyticsPage implements OnInit {
  private readonly store = inject(Store);
  private readonly entryService = inject(TimeSheetEntryService);
  private readonly toast = inject(ToastService);
  private readonly usersService = inject(UsersService);
  private readonly exportUtil = inject(TimeSheetExportUtil);

  public readonly loading = signal(false);

  public readonly projects = this.store.projects.projects;
  public readonly entries = signal<TimeSheetEntry[]>([]);
  public readonly users = signal<User[]>([]);
  public readonly filter = signal<AnalyticsFilter>({});

  public readonly filteredEntries = computed(() =>
    filterAnalyticsEntries(this.entries(), this.filter()),
  );

  public readonly totals = computed(() => {
    const entries = this.filteredEntries();
    const approved = entries
      .filter((e) => e.approved)
      .reduce((sum, e) => sum + (e.hours || 0), 0);
    const pending = entries
      .filter((e) => !e.approved)
      .reduce((sum, e) => sum + (e.hours || 0), 0);
    return {
      total: approved + pending,
      approved,
      pending,
      pendingCount: entries.filter((e) => !e.approved).length,
      contributors: new Set(entries.map((e) => e.userId)).size,
    };
  });

  public readonly rows = computed<ProjectRow[]>(() => {
    const colors = buildProjectColorMap(this.projects());
    const usersById = new Map(this.users().map((u) => [u.id, u]));
    const entries = this.filteredEntries();

    return this.projects()
      .map((project) => {
        const own = entries.filter((e) => e.projectId === project.id);
        const approved = own
          .filter((e) => e.approved)
          .reduce((sum, e) => sum + (e.hours || 0), 0);
        const pending = own
          .filter((e) => !e.approved)
          .reduce((sum, e) => sum + (e.hours || 0), 0);
        const hours = approved + pending;
        const userIds = [...new Set(own.map((e) => e.userId))];
        const latest = own.reduce<Date | null>(
          (max, e) => (!max || e.date > max ? e.date : max),
          null,
        );
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          color: colors.get(project.id) ?? 'var(--color-primary)',
          hours,
          approved,
          pending,
          approvedPercent: hours ? (approved / hours) * 100 : 0,
          contributors: userIds
            .slice(0, 3)
            .map((id) => this.initials(usersById.get(id) ?? null)),
          contributorCount: userIds.length,
          lastActivity: latest,
        };
      })
      .sort((a, b) => b.hours - a.hours);
  });

  public onFilterChange(filter: AnalyticsFilter): void {
    this.filter.set(filter);
  }

  public exportAll(): void {
    const entries = this.filteredEntries();
    if (!entries.length) {
      this.toast.info('No entries to export for the current filters.');
      return;
    }
    this.exportUtil.exportFilteredEntries(
      entries,
      this.projects(),
      this.users(),
      this.filter(),
      formatDateInput,
    );
  }

  private initials(user: User | null): string {
    const name = getUserDisplayName(user, '?');
    return (
      name
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?'
    );
  }

  public ngOnInit(): void {
    this.fetchTimeSheetEntries();
    this.fetchUsers();
  }

  private async fetchTimeSheetEntries(): Promise<void> {
    this.loading.set(true);

    await this.waitForProjects();
    if (!this.projects().length) {
      this.loading.set(false);
      return;
    }

    try {
      const projectIds = this.projects().map((project) => project.id);

      if (projectIds.length) {
        const entries = await this.entryService.findByProjectId(projectIds);
        this.entries.set(entries);
      }
    } catch (error) {
      this.toast.error('Failed to fetch time sheet entries');
      this.entries.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async waitForProjects(): Promise<void> {
    if (this.store.projects.fetchedAt()) return;
    while (true) {
      if (this.store.projects.fetchedAt()) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private async fetchUsers(): Promise<void> {
    try {
      const users = await this.usersService.fetchUsers();
      this.users.set(users);
    } catch (error) {
      this.toast.error('Failed to fetch users');
      this.users.set([]);
    }
  }
}
