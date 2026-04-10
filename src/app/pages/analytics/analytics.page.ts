import { FormsModule } from '@angular/forms';
import { appstraxAuth } from '@appstrax/services/auth';
import { ActivatedRoute, Params } from '@angular/router';
import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Store } from '@state';
import {
  ProjectUserRole,
  TimeSheetFilterState,
  TimeSheetEntry,
  Project,
} from '@models';
import { TimeSheetFilterUtil } from '@utils';
import { ProjectUserService, TimeSheetEntryService, ToastService } from '@services';

import { FilterViewContainerComponent } from './components/filter-view-container/filter-view-container.component';
import {
  SummaryMetricsComponent,
  SummaryMetrics,
} from './components/summary-metrics/summary-metrics.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    FormsModule,
    FilterViewContainerComponent,
    SummaryMetricsComponent,
  ],
  templateUrl: './analytics.page.html',
  styleUrl: './analytics.page.scss',
})
export class AnalyticsPage implements OnInit, OnDestroy {
  private store: Store = inject(Store);
  private projectUserService = inject(ProjectUserService);
  private timeSheetEntryService = inject(TimeSheetEntryService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private filterUtils = inject(TimeSheetFilterUtil);

  public projects = computed(() => this.store.projects.projects());

  public timeSheetEntries: TimeSheetEntry[] = [];
  public allTimeSheetEntries: TimeSheetEntry[] = [];
  public filteredEntries: TimeSheetEntry[] = [];

  public isLoading: boolean = true;
  public currentUserId: string = '';
  public canViewAllEntries: boolean = false;
  public canApprove: boolean = false;

  public selectedProject: Project | null = null;

  public filters: TimeSheetFilterState = {
    projectId: null,
    userId: '',
    status: 'all',
    dateRange: 'month',
    startDate: null,
    endDate: null,
    category: '',
  };

  private destroy$ = new Subject<void>();
  private isInitializingFilters = false;

  public summaryMetrics: SummaryMetrics = {
    totalHours: 0,
    pendingCount: 0,
    approvedCount: 0,
    projectsCount: 0,
  };

  constructor() {}

  async ngOnInit(): Promise<void> {
    try {
      if (!this.projects().length) {
        this.isLoading = false;
        return;
      }
      const user = await appstraxAuth.getUser();
      if (!user) {
        this.isLoading = false;
        return;
      }

      this.currentUserId = user.id;
      await this.checkPermissions();
      const params = this.route.snapshot.queryParams;
      this.loadFiltersFromUrl(params);

      await this.loadAllTimeSheetEntries();
      await this.loadTimeSheetEntries();

      let isFirstEmission = true;
      this.route.queryParams
        .pipe(takeUntil(this.destroy$))
        .subscribe((params) => {
          if (isFirstEmission) {
            isFirstEmission = false;
            return;
          }
          this.loadFiltersFromUrl(params);
          this.loadTimeSheetEntries();
        });

      this.isLoading = false;
    } catch (error) {
      this.toastService.error('Error loading timesheet overview');
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public async onFiltersChange(filters: TimeSheetFilterState): Promise<void> {
    this.filters = { ...filters };
    this.syncFiltersToUrl();
    await this.loadTimeSheetEntries();
  }

  

  public async onProjectSelected(project: Project | null): Promise<void> {
    this.selectedProject = project;
    this.filters.projectId = project?.id || null;
    this.filters.userId = '';
    this.filters.category = '';
    this.syncFiltersToUrl();
    await this.loadTimeSheetEntries();
  }

  public async approveAllPending(): Promise<void> {
    if (!this.canApprove) return;

    const pendingEntries = this.filteredEntries.filter((e) => !e.approved);
    if (!pendingEntries.length) {
      this.toastService.info('No pending entries to approve');
      return;
    }

    try {
      for (const entry of pendingEntries) {
        entry.approved = true;
        await this.timeSheetEntryService.save(entry);
      }
      this.toastService.success(
        `Approved ${pendingEntries.length} time entries`,
      );
      await this.loadAllTimeSheetEntries();
      await this.loadTimeSheetEntries();
    } catch (error) {
      this.toastService.error('Error approving time entries');
    }
  }

  public getSelectedProject(): Project | undefined {
    if (!this.filters.projectId) return undefined;
    return this.projects().find((p) => p.id === this.filters.projectId);
  }

  private async checkPermissions(): Promise<void> {
    const projUsers = await this.projectUserService.findByUserId(this.currentUserId);
    const isProjAdmin = projUsers.some(
      (pu) =>
        pu.role === ProjectUserRole.ADMIN ||
        pu.role === ProjectUserRole.APPROVER,
    );

    this.canViewAllEntries = isProjAdmin;
    this.canApprove = isProjAdmin;
  }

  private loadFiltersFromUrl(params: Params): void {
    const previousState = this.isInitializingFilters;
    this.isInitializingFilters = true;
    this.filters = this.filterUtils.parseFiltersFromParams(
      params,
      this.filters,
    );
    this.selectedProject = this.findProjectById(this.filters.projectId);
    this.isInitializingFilters = previousState;
  }

  private syncFiltersToUrl(): void {
    if (this.isInitializingFilters) return;
    this.filterUtils.syncFiltersToUrl(this.route, this.filters);
  }

  private findProjectById(id?: string | null): Project | null {
    if (!id) return null;
    return this.projects().find((project) => project.id === id) ?? null;
  }

  private async loadAllTimeSheetEntries(): Promise<void> {
    try {
      if (this.canViewAllEntries) {
        const accessibleProjectIds = this.getAccessibleProjectIds();

        if (!accessibleProjectIds.length) {
          this.allTimeSheetEntries = [];
          return;
        }

        this.allTimeSheetEntries =
          await this.timeSheetEntryService.findByProjectId(
            accessibleProjectIds,
          );
      } else {
        const result =
          await this.timeSheetEntryService.findByUserId(
            this.currentUserId,
          );
        this.allTimeSheetEntries = result || [];
      }
    } catch (error) {
      console.error('Error loading all time entries:', error);
      this.allTimeSheetEntries = [];
    }
  }

  private async loadTimeSheetEntries(): Promise<void> {
    try {
      this.timeSheetEntries = await this.fetchFilteredProjectEntries();
      this.filteredEntries = this.filterTimeSheetEntries();
      this.calculateSummaryMetrics();
    } catch (error) {
      this.toastService.error('Error loading time entries');
    }
  }

  private async fetchFilteredProjectEntries(): Promise<TimeSheetEntry[]> {
    if (this.canViewAllEntries) {
      const projectIds = this.getFilteredProjectIds();
      if (!projectIds.length) return [];
      return await this.timeSheetEntryService.findByProjectId(
        projectIds,
      );
    }

    const entries = await this.timeSheetEntryService.findByUserId(
      this.currentUserId,
    );

    if (!this.filters.projectId) {
      return entries || [];
    }

    return (entries || []).filter(
      (entry) => entry.projectId === this.filters.projectId,
    );
  }

  private getAccessibleProjectIds(): string[] {
    return this.projects().map((project) => project.id);
  }

  private getFilteredProjectIds(): string[] {
    const projectIds = this.getAccessibleProjectIds();
    if (this.filters.projectId) {
      return projectIds.filter((id) => id === this.filters.projectId);
    }
    return projectIds;
  }

  private filterTimeSheetEntries(): TimeSheetEntry[] {
    return this.timeSheetEntries.filter((e) => {
      if (this.filters.startDate && e.date < this.filters.startDate)
        return false;
      if (this.filters.endDate && e.date > this.filters.endDate) return false;
      if (this.filters.userId && e.userId !== this.filters.userId) return false;
      if (this.filters.category && e.category !== this.filters.category)
        return false;
      if (this.filters.status === 'approved' && !e.approved) return false;
      if (this.filters.status === 'pending' && e.approved) return false;
      return true;
    });
  }

  private calculateSummaryMetrics(): void {
    const allEntries = this.allTimeSheetEntries || [];
    const totalHours = allEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
    const projectCount = this.projects().length;
    this.summaryMetrics = {
      totalHours,
      pendingCount: allEntries.filter((e) => !e.approved).length,
      approvedCount: allEntries.filter((e) => e.approved).length,
      projectsCount: projectCount,
    };
  }
}
