import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeSheetEntry, Project } from '@models';
import { FilterViewSummaryComponent } from '../filter-view-summary/filter-view-summary.component';
import { FilterViewDetailsComponent } from '../filter-view-details/filter-view-details.component';
import { FilterViewTimelineComponent } from '../filter-view-timeline/filter-view-timeline.component';
import { UnapprovedEntriesComponent } from '../unapproved-entries/unapproved-entries.component';
import { TimeCalculationUtils } from 'src/app/utils/time-calculation-utils';

export type FilterViewType = 'summary' | 'details' | 'timeline' | 'unapproved' | 'byUser';

export interface TimeSheetFilterState {
  organizationId?: string | null;
  projectId?: string | null;
  userId?: string | null;
  dateRange: 'week' | 'month' | 'year' | 'all' | 'custom';
  startDate: Date | null;
  endDate: Date | null;
  status: 'all' | 'approved' | 'pending';
  category?: string | null;
}

@Component({
  selector: 'app-filter-view-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterViewSummaryComponent,
    FilterViewDetailsComponent,
    FilterViewTimelineComponent,
    UnapprovedEntriesComponent
  ],
  templateUrl: './filter-view-container.component.html',
  styleUrl: './filter-view-container.component.scss'
})
export class FilterViewContainerComponent implements OnInit, OnChanges {
  @Input() timeSheetEntries: TimeSheetEntry[] = [];
  @Input() filteredEntries: TimeSheetEntry[] = [];
  @Input() filters: TimeSheetFilterState = {
    dateRange: 'month',
    startDate: null,
    endDate: null,
    status: 'all',
    category: null,
  };
  @Input() selectedProject: Project | null = null;
  @Input() canApprove: boolean = false;
  @Input() pendingCount: number = 0;

  @Output() filtersChange = new EventEmitter<TimeSheetFilterState>();
  @Output() dateRangeChange = new EventEmitter<'week' | 'month' | 'year' | 'all' | 'custom'>();
  @Output() statusChange = new EventEmitter<'all' | 'approved' | 'pending'>();
  @Output() categoryChange = new EventEmitter<string | null>();
  @Output() userChange = new EventEmitter<string | null>();
  @Output() projectSelected = new EventEmitter<Project | null>();
  @Output() refreshRequested = new EventEmitter<void>();
  @Output() approveAllRequested = new EventEmitter<void>();

  public currentViewType: FilterViewType = 'summary';
  public isViewSelectionCollapsed: boolean = false;

  public viewTypes: { value: FilterViewType; label: string; icon: string; description: string }[] = [
    { value: 'summary', label: 'Summary', icon: 'bi-bar-chart', description: 'Totals by project' },
    { value: 'details', label: 'Details', icon: 'bi-list-check', description: 'Grouped by day' },
    { value: 'timeline', label: 'Timeline', icon: 'bi-calendar-event', description: 'Daily totals' },
    { value: 'byUser', label: 'By User', icon: 'bi-people', description: 'Grouped by user' },
    { value: 'unapproved', label: 'Unapproved', icon: 'bi-exclamation-triangle', description: 'Pending items' },
  ];

  public totalHours: number = 0;
  public approvedHours: number = 0;
  public pendingHours: number = 0;
  public totalEntries: number = 0;
  public totalProjects: number = 0;
  public availableCategories: string[] = [];
  public availableUsers: { id: string; name: string }[] = [];

  ngOnInit(): void {
    const allEntries = this.filteredEntries.length > 0 ? this.filteredEntries : this.timeSheetEntries;
    this.recalculateStats(allEntries);
    this.updateAvailableCategories();
    this.updateAvailableUsers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeSheetEntries'] || changes['filteredEntries'] || changes['filters']) {
      const allEntries = this.filteredEntries.length > 0 ? this.filteredEntries : this.timeSheetEntries;
      this.recalculateStats(allEntries);
      this.updateAvailableCategories();
      this.updateAvailableUsers();
    }
  }

  private recalculateStats(entries: TimeSheetEntry[]): void {
    this.totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    this.approvedHours = entries.filter(e => e.approved).reduce((sum, e) => sum + e.hours, 0);
    this.pendingHours = entries.filter(e => !e.approved).reduce((sum, e) => sum + e.hours, 0);
    this.totalEntries = entries.length;
    this.totalProjects = new Set(entries.map(e => e.projectId)).size;
  }

  private updateAvailableCategories(): void {
    const allEntries = this.filteredEntries.length > 0 ? this.filteredEntries : this.timeSheetEntries;
    const categories = allEntries
      .map(e => e.category)
      .filter(c => c && c.trim() !== '');
    this.availableCategories = [...new Set(categories)].sort();
  }

  private updateAvailableUsers(): void {
    // Get entries based on current organization/project filters
    // Use timeSheetEntries (before user filter is applied) to show all available users
    // for the selected organization/project
    const entriesToUse = this.timeSheetEntries;

    // Extract unique user IDs from entries (no duplicates)
    const userIds = new Set<string>();
    entriesToUse.forEach(entry => {
      if (entry.userId && entry.userId.trim() !== '') {
        userIds.add(entry.userId);
      }
    });

    // Convert to array of user objects with display names
    this.availableUsers = Array.from(userIds)
      .map(userId => ({
        id: userId,
        name: this.getUserName(userId)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private getUserName(userId: string): string {
    // For now, use a shortened version of the ID
    // In a real app, you'd fetch user details from a service
    if (userId.length > 20) {
      return userId.substring(0, 20) + '...';
    }
    return userId;
  }

  public onViewTypeChange(viewType: FilterViewType): void {
    this.currentViewType = viewType;
  }

  public toggleViewSelection(): void {
    this.isViewSelectionCollapsed = !this.isViewSelectionCollapsed;
  }

  public getEntriesForView(): TimeSheetEntry[] {
    return this.filteredEntries.length > 0 ? this.filteredEntries : this.timeSheetEntries;
  }

  public onDateRangeChange(): void {
    this.filtersChange.emit({ ...this.filters });
    this.dateRangeChange.emit(this.filters.dateRange);
  }

  public onStatusChange(): void {
    this.filtersChange.emit({ ...this.filters });
    this.statusChange.emit(this.filters.status);
  }

  public onCategoryChange(): void {
    this.filtersChange.emit({ ...this.filters });
    this.categoryChange.emit(this.filters.category || null);
  }

  public onUserChange(): void {
    this.filtersChange.emit({ ...this.filters });
    this.userChange.emit(this.filters.userId || null);
  }

  public onProjectSelected(project: Project | null): void {
    this.filters.projectId = project?.id ?? null;
    this.filtersChange.emit({ ...this.filters });
    this.projectSelected.emit(project);
  }

  public onRefresh(): void {
    this.refreshRequested.emit();
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

