import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

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
export class HomePage implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly timeSheetEntryService = inject(TimeSheetEntryService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly filterUtils = inject(TimeSheetFilterUtil);

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
  private queryParamsSub?: Subscription;
  private lastLoadedUserId: string | null = null;

  constructor() {
    effect(() => {
      const user = this.store.user.user();
      const userLoading = this.store.user.loading();
      const projects = this.store.projects.projects();
      const projectsLoading = this.store.projects.loading();

      if (userLoading || (projectsLoading && user?.id && !projects.length)) {
        this.isLoading.set(true);
        return;
      }

      if (!user?.id) {
        this.isLoading.set(false);
        this.hasLoaded.set(true);
        this.entries.set([]);
        this.filteredEntryCount.set(0);
        this.lastLoadedUserId = null;
        return;
      }

      if (this.lastLoadedUserId !== user.id) {
        this.lastLoadedUserId = user.id;
        void this.loadEntriesForActiveFilter(user.id);
      }
    });
  }

  ngOnInit(): void {
    this.queryParamsSub = this.route.queryParams.subscribe(() => {
      const userId = this.store.user.user()?.id;
      if (!userId) return;
      void this.loadEntriesForActiveFilter(userId);
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSub?.unsubscribe();
  }

  private resolveFetchBounds(): { start: Date; end: Date } {
    const filter = this.filterUtils.parseFilters(this.route.snapshot.queryParams);
    if (filter.start && filter.end) {
      return { start: filter.start, end: filter.end };
    }
    return this.filterUtils.calculateDateRangeBounds(
      filter.dateRange ?? 'month',
      filter.start,
      filter.end,
    );
  }

  private async loadEntriesForActiveFilter(userId: string): Promise<void> {
    const loadId = ++this.latestLoadId;
    const { start, end } = this.resolveFetchBounds();
    this.isLoading.set(true);

    try {
      const entries = await this.timeSheetEntryService.findByUserAndDateRange(
        userId,
        start,
        end,
      );
      if (loadId !== this.latestLoadId) return;
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
