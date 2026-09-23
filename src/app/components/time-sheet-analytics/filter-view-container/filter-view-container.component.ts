import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { FilterViewSummaryComponent } from '../filter-view-summary/filter-view-summary.component';
import { FilterViewDetailsComponent } from '../filter-view-details/filter-view-details.component';
import { FilterViewTimelineComponent } from '../filter-view-timeline/filter-view-timeline.component';
import { UnapprovedEntriesComponent } from '../unapproved-entries/unapproved-entries.component';
import { FilterBlockComponent } from '../filter-block/filter-block.component';
import {
  TimeSheetEntry,
  Project,
  AnalyticsFilter,
  User,
  Status,
  DateRange,
} from '@models';
import { TimeSheetFilterUtil, getUserDisplayName, TimeSheetExportUtil } from '@utils';
import { ToastService } from '@services';

export type FilterView = 'summary' | 'details' | 'timeline' | 'unapproved';

@Component({
  selector: 'app-filter-view-container',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    FormsModule,
    FilterBlockComponent,
    FilterViewSummaryComponent,
    FilterViewDetailsComponent,
    FilterViewTimelineComponent,
    UnapprovedEntriesComponent,
  ],
  templateUrl: './filter-view-container.component.html',
  styleUrl: './filter-view-container.component.scss',
})
export class FilterViewContainerComponent
  implements OnInit, OnChanges, OnDestroy
{
  private route: ActivatedRoute = inject(ActivatedRoute);
  private toast: ToastService = inject(ToastService);
  private filterUtils: TimeSheetFilterUtil = inject(TimeSheetFilterUtil);
  private readonly exportUtil = inject(TimeSheetExportUtil);
  public readonly projects = input<Project[]>([]);
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly users = input<User[]>([]);
  public readonly availableViews = input<FilterView[]>([
    'summary',
    'details',
    'timeline',
    'unapproved',
  ]);
  public readonly showUserFilter = input(true);
  public readonly showExport = input(false);
  public readonly linkProjectsToTimeSheet = input(false);
  /** Tighter layout with less marketing copy — used on /home. */
  public readonly compact = input(false);
  /** Timeline day review: allow approve/unapprove (requires parent `entryUpdated`). */
  public readonly canManageStatus = input(false);
  /** Unapproved view: allow per-entry approval (requires parent `entryUpdated`). */
  public readonly canApprove = input(false);

  public readonly entryUpdated = output<TimeSheetEntry>();

  public readonly filter = signal<AnalyticsFilter>({
    status: 'all',
    dateRange: 'month',
  });

  public readonly filteredEntries = signal<TimeSheetEntry[]>([]);
  public readonly view = signal<FilterView>('summary');
  public readonly categories = signal<string[]>([]);

  private subscription: Subscription | undefined;

  public readonly viewTypes: {
    value: FilterView;
    label: string;
    icon: string;
    description: string;
  }[] = [
    {
      value: 'summary',
      label: 'Summary',
      icon: 'bi-bar-chart',
      description: 'Totals by project',
    },
    {
      value: 'details',
      label: 'Details',
      icon: 'bi-list-check',
      description: 'Grouped by day',
    },
    {
      value: 'timeline',
      label: 'Timeline',
      icon: 'bi-calendar-event',
      description: 'Daily totals',
    },
    {
      value: 'unapproved',
      label: 'Unapproved',
      icon: 'bi-exclamation-triangle',
      description: 'Pending items',
    },
  ];

  public readonly visibleViewTypes = computed(() =>
    this.viewTypes.filter((viewType) =>
      this.availableViews().includes(viewType.value),
    ),
  );

  public readonly activeView = computed<FilterView>(() => {
    const available = this.availableViews();
    const current = this.view();
    return available.includes(current) ? current : available[0];
  });

  ngOnInit(): void {
    this.subscription = this.route.queryParams.subscribe((params) => {
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
      this.filter.set(filter);
      this.filterEntries();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries']) {
      this.filterEntries();
      this.populateCategories();
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private filterEntries(): void {
    const entries = this.entries();
    const filters = this.filter();

    const filteredEntries = entries.filter((e) => {
      if (filters.start && e.date < filters.start) return false;
      if (filters.end && e.date > filters.end) return false;
      if (filters.projectId && e.projectId !== filters.projectId) return false;
      if (filters.userId && e.userId !== filters.userId) return false;
      if (filters.category && e.category !== filters.category) return false;
      if (filters.status === 'approved' && !e.approved) return false;
      if (filters.status === 'pending' && e.approved) return false;
      return true;
    });

    this.filteredEntries.set(filteredEntries);
  }

  private populateCategories(): void {
    const categories = this.entries()
      .map((entry) => entry.category)
      .filter((category) => category && category.trim() !== '');
    this.categories.set([...new Set(categories)].sort());
  }

  public onViewTypeChange(view: FilterView): void {
    this.view.set(view);
  }

  public onProjectChange(projectId: string): void {
    this.updateFilters({ projectId: projectId || undefined });
  }

  public onStatusChange(status: Status): void {
    this.updateFilters({ status });
  }

  public onCategoryChange(category: string): void {
    this.updateFilters({ category });
  }

  public onUserChange(userId: string): void {
    this.updateFilters({ userId });
  }

  public getDisplayName(user: User | null): string {
    return getUserDisplayName(user);
  }

  public onDateRangeChange(dateRange: DateRange): void {
    const { start, end } = this.filterUtils.calculateDateRangeBounds(
      dateRange,
      this.filter().start,
      this.filter().end,
    );
    this.updateFilters({ dateRange, start, end });
  }

  public onCustomStartDateChange(value: string): void {
    this.updateFilters({ start: this.parseDateFromInput(value) });
  }

  public onCustomEndDateChange(value: string): void {
    this.updateFilters({ end: this.parseDateFromInput(value) });
  }

  private parseDateFromInput(value: string): Date | undefined {
    if (!value) return undefined;
    const [year, month, day] = value.split('-').map(Number);
    if (![year, month, day].every((v) => !isNaN(v))) return undefined;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  private updateFilters(partial: Partial<AnalyticsFilter>): void {
    const filters = { ...this.filter(), ...partial };
    this.filterUtils.updateQueryParams(this.route, filters);
  }

  public formatDate(date?: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public exportAllProjects(): void {
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
      this.formatDate.bind(this),
    );
  }

  public onSingleEntryApproved(entry: TimeSheetEntry): void {
    this.entryUpdated.emit(entry);
  }
}
