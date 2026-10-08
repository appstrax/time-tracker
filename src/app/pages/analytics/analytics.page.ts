import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AnalyticsFilter, TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, ToastService, UsersService } from '@services';
import {
  InsightsChartsComponent,
  ProjectPreviewComponent,
} from '@components';
import { Store } from '@state';
import { TimeSheetExportUtil, TimeSheetFilterUtil } from '@utils';

import {
  buildProjectUserIds,
  filterAnalyticsEntries,
  narrowToProject,
  formatDateInput,
  isProjectUserPairValid,
  scopeProjectsToUser,
} from './analytics-filter.util';
import {
  ProjectRow,
  buildProjectRows,
  summarizeEntries,
} from './analytics-rows.util';
import { AnalyticsFiltersComponent, MetricCardComponent } from './components';

@Component({
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
  templateUrl: './analytics.page.html',
  styleUrl: './analytics.page.scss',
})
export class AnalyticsPage implements OnInit {
  private readonly store = inject(Store);
  private readonly entryService = inject(TimeSheetEntryService);
  private readonly toast = inject(ToastService);
  private readonly usersService = inject(UsersService);
  private readonly exportUtil = inject(TimeSheetExportUtil);
  private readonly route = inject(ActivatedRoute);
  private readonly filterUtils = inject(TimeSheetFilterUtil);

  public readonly loading = signal(false);

  public readonly projects = this.store.projects.projects;
  public readonly entries = signal<TimeSheetEntry[]>([]);
  public readonly users = signal<User[]>([]);
  public readonly filter = signal<AnalyticsFilter>({});

  /**
   * Projects the selected team member is in or has logged time on (all of them
   * when nobody is selected). Scoped against the unfiltered entries so changing
   * the date range never makes a project vanish from the list.
   */
  public readonly scopedProjects = computed(() =>
    scopeProjectsToUser(this.projects(), this.filter().userId, this.entries()),
  );

  /** `scopedProjects` narrowed to the project picked in the dropdown. */
  public readonly visibleProjects = computed(() =>
    narrowToProject(
      this.scopedProjects(),
      this.filter().projectId,
      this.projects(),
    ),
  );

  public readonly projectUserIds = computed(() =>
    buildProjectUserIds(this.projects(), this.entries()),
  );

  /** Team members to pick from: only the selected project's, else everyone. */
  public readonly projectUsers = computed(() => {
    const memberIds = this.projectUserIds().get(this.filter().projectId ?? '');
    if (!memberIds) return this.users();
    return this.users().filter((u) => memberIds.has(u.id));
  });

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
      this.users(),
      this.projects(),
    ),
  );

  constructor() {
    // A project and team member from a stale or edited URL that cannot apply
    // together: drop the project. Waits for the entries, as a member who only
    // logged time on a project is not known as one until they load.
    effect(() => {
      if (this.loading() || !this.projects().length) return;
      const filter = this.filter();
      if (
        !isProjectUserPairValid(
          this.projectUserIds(),
          filter.projectId,
          filter.userId,
        )
      ) {
        this.filterUtils.updateQueryParams(this.route, {
          ...filter,
          projectId: undefined,
        });
      }
    });
  }

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
