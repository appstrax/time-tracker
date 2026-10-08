import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';

import { InsightsChartsComponent, ProjectPreviewComponent } from '@components';
import { AnalyticsFilter, TimeSheetEntry, UserRole } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { Store } from '@state';
import { TimeSheetFilterUtil, storeTimeSheetFilterProjectId } from '@utils';

import {
  filterAnalyticsEntries,
  narrowToProject,
  scopeProjectsToUser,
} from '../analytics/analytics-filter.util';
import {
  ProjectRow,
  buildProjectRows,
  summarizeEntries,
} from '../analytics/analytics-rows.util';
import {
  AnalyticsFiltersComponent,
  MetricCardComponent,
} from '../analytics/components';

@Component({
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    AnalyticsFiltersComponent,
    InsightsChartsComponent,
    MetricCardComponent,
    ProjectPreviewComponent,
  ],
})
export class HomePage {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly filterUtils = inject(TimeSheetFilterUtil);
  private readonly timeSheetEntryService = inject(TimeSheetEntryService);
  private readonly toast = inject(ToastService);

  private readonly queryParams = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams as Params,
  });

  public readonly isLoading = signal(true);
  public readonly hasLoaded = signal(false);
  public readonly entries = signal<TimeSheetEntry[]>([]);
  public readonly filter = signal<AnalyticsFilter>({});
  /**
   * Projects the signed-in user is assigned to, including ones with no time
   * logged yet. A regular user's store already holds only their projects, and
   * their `users` lists are not populated, so only admins, whose store holds
   * every project, need scoping. It goes by assignment alone, not entries, so
   * the list does not change while a new date range loads.
   */
  public readonly projects = computed(() => {
    const all = this.store.projects.projects();
    const user = this.store.user.user();
    if (user?.role !== UserRole.ADMIN) return all;
    return scopeProjectsToUser(all, user.id, []);
  });
  public readonly hasProjects = computed(() => this.projects().length > 0);

  /** `projects` narrowed to the one picked in the dropdown, if any. */
  public readonly visibleProjects = computed(() =>
    narrowToProject(this.projects(), this.filter().projectId),
  );

  /**
   * Entries on the listed projects only, as on the analytics page, so the KPIs
   * and charts always agree with the project rows.
   */
  public readonly filteredEntries = computed(() => {
    const visibleIds = new Set(this.visibleProjects().map((p) => p.id));
    return filterAnalyticsEntries(this.entries(), this.filter()).filter((e) =>
      visibleIds.has(e.projectId),
    );
  });
  public readonly totals = computed(() =>
    summarizeEntries(this.filteredEntries()),
  );
  public readonly rows = computed<ProjectRow[]>(() =>
    buildProjectRows(
      this.visibleProjects(),
      this.filteredEntries(),
      [],
      this.store.projects.projects(),
    ),
  );

  private latestLoadId = 0;
  /** Bounds key for which `entries` was last loaded successfully. */
  private loadedBoundsKey: string | null = null;
  /** Bounds key currently being fetched, if any. */
  private pendingBoundsKey: string | null = null;

  constructor() {
    effect(() => {
      const user = this.store.user.user();
      const userLoading = this.store.user.loading();
      const projects = this.store.projects.projects();
      const projectsLoading = this.store.projects.loading();
      const params = this.queryParams();

      if (userLoading || (projectsLoading && user?.id && !projects.length)) {
        this.isLoading.set(true);
        return;
      }

      if (!user?.id) {
        this.isLoading.set(false);
        this.hasLoaded.set(true);
        this.entries.set([]);
        this.loadedBoundsKey = null;
        this.pendingBoundsKey = null;
        return;
      }

      const { start, end } = this.resolveFilterBounds(params);
      const boundsKey = `${user.id}:${start.getTime()}:${end.getTime()}`;
      if (
        boundsKey === this.loadedBoundsKey &&
        this.pendingBoundsKey !== boundsKey
      ) {
        return;
      }
      if (this.pendingBoundsKey === boundsKey) {
        return;
      }

      this.pendingBoundsKey = boundsKey;
      this.loadedBoundsKey = null;
      this.isLoading.set(true);
      this.entries.set([]);
      void this.loadEntriesForRange(user.id, start, end, boundsKey);
    });
  }

  private resolveFilterBounds(params: Params): { start: Date; end: Date } {
    const filter = this.filterUtils.resolveFilter(params);
    if (filter.dateRange === 'all') {
      return {
        start: this.filterUtils.allPresetFetchStart(filter.end),
        end: filter.end,
      };
    }
    return { start: filter.start, end: filter.end };
  }

  private async loadEntriesForRange(
    userId: string,
    start: Date,
    end: Date,
    boundsKey: string,
  ): Promise<void> {
    const loadId = ++this.latestLoadId;

    try {
      const entries = await this.timeSheetEntryService.findByUserAndDateRange(
        userId,
        start,
        end,
      );
      if (loadId !== this.latestLoadId) return;
      this.loadedBoundsKey = boundsKey;
      this.entries.set(entries);
    } catch {
      if (loadId !== this.latestLoadId) return;
      this.entries.set([]);
      this.toast.error('Unable to load your time entries.');
    } finally {
      if (loadId !== this.latestLoadId) return;
      if (this.pendingBoundsKey === boundsKey) {
        this.pendingBoundsKey = null;
      }
      this.isLoading.set(false);
      this.hasLoaded.set(true);
    }
  }

  public onFilterChange(filter: AnalyticsFilter): void {
    // Home only ever holds the signed-in user's entries and has no team member
    // or category control to clear them, so ignore stray `userId` and
    // `category` values in the URL.
    this.filter.set({ ...filter, userId: undefined, category: undefined });
  }

  /** Makes the time sheet, opened by the row link, filter to this project. */
  public rememberProject(projectId: string): void {
    storeTimeSheetFilterProjectId(projectId);
  }
}
