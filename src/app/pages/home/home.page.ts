import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params } from '@angular/router';

import { FilterView, FilterViewContainerComponent } from '@components';
import { TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { Store } from '@state';
import { TimeSheetFilterUtil } from '@utils';

@Component({
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [FilterViewContainerComponent],
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
  public readonly filteredEntryCount = signal(0);
  public readonly projects = computed(() => this.store.projects.projects());
  public readonly hasProjects = computed(() => this.projects().length > 0);

  public readonly noUsers: User[] = [];
  public readonly homeAvailableViews: FilterView[] = [
    'summary',
    'details',
    'timeline',
  ];

  private latestLoadId = 0;
  private lastFetchBoundsKey: string | null = null;

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
        this.filteredEntryCount.set(0);
        this.lastFetchBoundsKey = null;
        return;
      }

      const { start, end } = this.resolveFilterBounds(params);
      const boundsKey = `${user.id}:${start.getTime()}:${end.getTime()}`;
      if (boundsKey === this.lastFetchBoundsKey) {
        return;
      }

      void this.loadEntriesForRange(user.id, start, end, boundsKey);
    });
  }

  private resolveFilterBounds(params: Params): { start: Date; end: Date } {
    const filter = this.filterUtils.parseFilters(params);
    if (!filter.start || !filter.end) {
      const bounds = this.filterUtils.calculateDateRangeBounds(
        filter.dateRange ?? 'month',
        filter.start,
        filter.end,
      );
      filter.start = bounds.start;
      filter.end = bounds.end;
    }

    return { start: filter.start!, end: filter.end! };
  }

  private async loadEntriesForRange(
    userId: string,
    start: Date,
    end: Date,
    boundsKey: string,
  ): Promise<void> {
    const loadId = ++this.latestLoadId;
    this.isLoading.set(true);

    try {
      const entries = await this.timeSheetEntryService.findByUserAndDateRange(
        userId,
        start,
        end,
      );
      if (loadId !== this.latestLoadId) return;
      this.lastFetchBoundsKey = boundsKey;
      this.entries.set(entries);
    } catch {
      if (loadId !== this.latestLoadId) return;
      this.entries.set([]);
      this.toast.error('Unable to load your time entries.');
    } finally {
      if (loadId !== this.latestLoadId) return;
      this.isLoading.set(false);
      this.hasLoaded.set(true);
    }
  }

  public onFilteredEntryCountChange(count: number): void {
    this.filteredEntryCount.set(count);
  }

  public onEntryUpdated(entry: TimeSheetEntry): void {
    this.entries.update((entries) =>
      entries.map((e) => (e.id === entry.id ? entry : e)),
    );
  }
}
