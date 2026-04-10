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
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';

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
import { TimeSheetFilterUtil, TimeSheetDisplayUtil } from '@utils';
import { TimeSheetEntryService, ToastService } from '@services';

export type FilterView = 'summary' | 'details' | 'timeline' | 'unapproved';

@Component({
  selector: 'app-filter-view-container',
  standalone: true,
  imports: [
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
  private entryService: TimeSheetEntryService = inject(TimeSheetEntryService);

  public readonly projects = input<Project[]>([]);
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly users = input<User[]>([]);

  public readonly entryUpdated = output<TimeSheetEntry>();

  public readonly filter = signal<AnalyticsFilter>({
    status: 'all',
    dateRange: 'month',
  });

  public readonly filteredEntries = signal<TimeSheetEntry[]>([]);
  public readonly view = signal<FilterView>('summary');
  public readonly isViewCollapsed = signal(false);
  public project = computed(() => this.getProject(this.filter().projectId));
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

  ngOnInit(): void {
    this.subscription = this.route.queryParams.subscribe((params) => {
      const filter = this.filterUtils.parseFilters(params);
      this.filter.set(filter);
      this.filterEntries();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries']) {
      this.filterEntries();
      this.populateCategories();
    }

    if (changes['filter']) {
      this.filterEntries();
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private filterEntries(): void {
    const entries = this.entries();
    const filters = this.filter();

    const filteredEntries = entries.filter((entry) => {
      if (filters.start && entry.date < filters.start) return false;
      if (filters.end && entry.date > filters.end) return false;
      if (filters.userId && entry.userId !== filters.userId) return false;
      if (filters.category && entry.category !== filters.category) return false;
      if (filters.status === 'approved' && !entry.approved) return false;
      if (filters.status === 'pending' && entry.approved) return false;
      return true;
    });

    this.filteredEntries.set(filteredEntries);
  }

  private getProject(id?: string): Project | null {
    if (!id) return null;
    return this.projects().find((project) => project.id === id) ?? null;
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

  public toggleViewCollapsed(): void {
    this.isViewCollapsed.update((collapsed) => !collapsed);
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

  public async onApproveAll(): Promise<void> {
    const pendingEntries = this.filteredEntries().filter(
      (entry) => !entry.approved,
    );
    if (!pendingEntries.length) {
      this.toast.info('No pending entries to approve');
      return;
    }

    try {
      for (const entry of pendingEntries) {
        entry.approved = true;
        const savedEntry = await this.entryService.save(entry);
        this.entryUpdated.emit(savedEntry);
      }

      this.toast.success(`Approved ${pendingEntries.length} time entries`);
    } catch (error) {
      this.toast.error('Error approving time entries');
    }
  }
}
