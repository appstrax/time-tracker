import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TimeSheetEntry, Project, User } from '@models';
import { FilterViewSummaryComponent } from '../filter-view-summary/filter-view-summary.component';
import { FilterViewDetailsComponent } from '../filter-view-details/filter-view-details.component';
import { FilterViewTimelineComponent } from '../filter-view-timeline/filter-view-timeline.component';
import { UnapprovedEntriesComponent } from '../unapproved-entries/unapproved-entries.component';
import { FilterBlockComponent } from '../../../../../components/filter-block/filter-block.component';
import { TimeCalculationUtils } from 'src/app/utils/time-calculation-utils';
import { TimeSheetFilterState } from '../../models/time-sheet-filter-state.model';
import { TimeSheetFilterUtilsService } from '../../services/time-sheet-filter-utils.service';

export type FilterViewType = 'summary' | 'details' | 'timeline' | 'unapproved';

@Component({
  selector: 'app-filter-view-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterBlockComponent,
    FilterViewSummaryComponent,
    FilterViewDetailsComponent,
    FilterViewTimelineComponent,
    UnapprovedEntriesComponent
  ],
  templateUrl: './filter-view-container.component.html',
  styleUrl: './filter-view-container.component.scss'
})
export class FilterViewContainerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() timeSheetEntries: TimeSheetEntry[] = [];
  @Input() filteredEntries: TimeSheetEntry[] = [];
  @Input() selectedProject: Project | null = null;
  @Input() canApprove: boolean = false;
  @Input() pendingCount: number = 0;

  @Output() filtersChange = new EventEmitter<TimeSheetFilterState>();
  @Output() approveAllRequested = new EventEmitter<void>();

  public filters: TimeSheetFilterState = {
    dateRange: 'month',
    startDate: null,
    endDate: null,
    status: 'all',
    category: '',
    userId: '',
  };

  public currentViewType: FilterViewType = 'summary';
  public isViewSelectionCollapsed: boolean = false;

  private destroy$ = new Subject<void>();
  private isInitializing = false;

  public viewTypes: { value: FilterViewType; label: string; icon: string; description: string }[] = [
    { value: 'summary', label: 'Summary', icon: 'bi-bar-chart', description: 'Totals by project' },
    { value: 'details', label: 'Details', icon: 'bi-list-check', description: 'Grouped by day' },
    { value: 'timeline', label: 'Timeline', icon: 'bi-calendar-event', description: 'Daily totals' },
    { value: 'unapproved', label: 'Unapproved', icon: 'bi-exclamation-triangle', description: 'Pending items' },
  ];

  public totalHours: number = 0;
  public approvedHours: number = 0;
  public pendingHours: number = 0;
  public totalEntries: number = 0;
  public totalProjects: number = 0;
  public categories: string[] = [];
  public users: { id: string; name: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private filterUtils: TimeSheetFilterUtilsService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    this.loadFiltersFromUrl(params);

    let isFirstEmission = true;
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (isFirstEmission) {
          isFirstEmission = false;
          return;
        }
        this.loadFiltersFromUrl(params);
      });

    this.initialize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeSheetEntries'] || changes['filteredEntries']) {
      this.initialize();
    }
  }

  initialize(): void {
    const allEntries = this.filteredEntries;
    this.recalculateStats(allEntries);
    this.updateAvailableCategories();
    this.updateAvailableUsers();
  }

  private recalculateStats(entries: TimeSheetEntry[]): void {
    this.totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    this.approvedHours = entries.filter(e => e.approved).reduce((sum, e) => sum + e.hours, 0);
    this.pendingHours = entries.filter(e => !e.approved).reduce((sum, e) => sum + e.hours, 0);
    this.totalEntries = entries.length;
    this.totalProjects = new Set(entries.map(e => e.projectId)).size;
  }

  private updateAvailableCategories(): void {
    const categories = this.timeSheetEntries
      .map(e => e.category)
      .filter(c => c && c.trim() !== '');
    this.categories = [...new Set(categories)].sort();
  }

  private updateAvailableUsers(): void {
    const entriesToUse = this.timeSheetEntries;
    const userIds = new Set<string>();
    entriesToUse.forEach(entry => {
      if (entry.userId && entry.userId.trim() !== '') {
        userIds.add(entry.userId);
      }
    });
    this.users = Array.from(userIds)
      .map(userId => ({
        id: userId,
        name: this.getUserName(userId)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private getUserName(userId: string): string {
    if (userId.length > 20) {
      return userId.substring(0, 20) + '...';
    }
    return userId;
  }

  private loadFiltersFromUrl(params: Params): void {
    const previousState = this.isInitializing;
    this.isInitializing = true;
    this.filters = this.filterUtils.parseFiltersFromParams(params, this.filters, {
      preserveOrganizationAndProject: true,
    });
    this.isInitializing = previousState;
  }

  private syncOrgAndProjectFromUrl(): void {
    const params = this.route.snapshot.queryParams;
    this.filters.organizationId = this.normalizeNullableParam(params['organizationId']);
    this.filters.projectId = this.normalizeNullableParam(params['projectId']);
  }

  private normalizeNullableParam(value: any): string | null {
    if (value === undefined || value === null || value === '') return null;
    return value;
  }

  private emitFilterChange(): void {
    if (this.isInitializing) return;
    this.syncOrgAndProjectFromUrl();
    this.filterUtils.syncFiltersToUrl(this.route, this.filters, {
      preserveExistingOrgProject: true,
    });
    this.filtersChange.emit({ ...this.filters });
  }

  public onDateRangeChange(): void {
    if (this.filters.dateRange === 'custom') {
      const today = new Date();
      this.filters.startDate =
        this.filters.startDate ?? new Date(today.getFullYear(), today.getMonth(), today.getDate());
      this.filters.endDate =
        this.filters.endDate ?? new Date(this.filters.startDate);
      this.emitFilterChange();
      return;
    }

    const { startDate, endDate } = this.filterUtils.calculateDateRangeBounds(
      this.filters.dateRange,
      this.filters.startDate,
      this.filters.endDate
    );
    this.filters.startDate = startDate;
    this.filters.endDate = endDate;
    this.emitFilterChange();
  }

  public onViewTypeChange(viewType: FilterViewType): void {
    this.currentViewType = viewType;
  }

  public toggleViewSelection(): void {
    this.isViewSelectionCollapsed = !this.isViewSelectionCollapsed;
  }

  public getEntriesForView(): TimeSheetEntry[] {
    return this.filteredEntries;
  }

  onEmitFilterChange(): void {
    this.emitFilterChange();
  }

  toDateInput(date: Date | null): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onCustomStartDateChange(value: string): void {
    this.filters.startDate = this.parseDateFromInput(value);
    this.emitFilterChange();
  }

  onCustomEndDateChange(value: string): void {
    this.filters.endDate = this.parseDateFromInput(value);
    this.emitFilterChange();
  }

  private parseDateFromInput(value: string): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (![year, month, day].every(v => !isNaN(v))) return null;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  public onApproveAll(): void {
    this.approveAllRequested.emit();
  }

  public formatHours(hours: number): string {
    return TimeCalculationUtils.formatHours(hours);
  }

  public getTotalHoursLabel(): string {
    return this.formatHours(this.totalHours);
  }

  public getApprovedHoursLabel(): string {
    return this.formatHours(this.approvedHours);
  }

  public getPendingHoursLabel(): string {
    return this.formatHours(this.pendingHours);
  }
}

