import { Component, OnInit, Signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Store } from '@state';
import { TimeSheetEntry, Project, User, Organization } from '@models';
import { OrgUserRoles, ProjectUserRoles } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { SplitPaneComponent, SplitPaneVerticalComponent } from '@components';
import { OrganizationSelectorComponent } from './components/organization-selector/organization-selector.component';
import { FilterViewContainerComponent } from './components/filter-view-container/filter-view-container.component';
import { SummaryMetricsComponent, SummaryMetrics } from './components/summary-metrics/summary-metrics.component';
import { appstraxAuth, Operator } from '@appstrax/services/auth';
import { TimeCalculationUtils } from 'src/app/utils/time-calculation-utils';
import { TimeSheetFilterState } from './models/time-sheet-filter-state.model';
import { TimeSheetFilterUtilsService } from './services/time-sheet-filter-utils.service';




@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SplitPaneComponent,
    SplitPaneVerticalComponent,
    OrganizationSelectorComponent,
    FilterViewContainerComponent,
    SummaryMetricsComponent,
  ],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit, OnDestroy {
  public projects: Signal<Project[]>;
  public organizations: Signal<Organization[]>;
  public timeSheetEntries: TimeSheetEntry[] = [];
  public allTimeSheetEntries: TimeSheetEntry[] = []; // All entries for global metrics (unfiltered)
  public filteredEntries: TimeSheetEntry[] = [];
  public allUsers: User[] = []; // For admin view

  public isLoading: boolean = true;
  public currentUserId: string = '';
  public canViewAllEntries: boolean = false;
  public canApprove: boolean = false;

  public selectedOrganization: Organization | null = null;
  public selectedProject: Project | null = null;

  public filters: TimeSheetFilterState = {
    organizationId: null,
    projectId: null,
    userId: '',
    status: 'all',
    dateRange: 'month',
    startDate: null,
    endDate: null,
    category: '',
  };

  private destroy$ = new Subject<void>();
  private isInitializing = false;

  public summaryMetrics: SummaryMetrics = {
    totalHours: 0,
    pendingCount: 0,
    approvedCount: 0,
    projectsCount: 0,
    organizationsCount: 0,
  };

  constructor(
    private store: Store,
    private timeSheetEntryService: TimeSheetEntryService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private filterUtils: TimeSheetFilterUtilsService,
  ) {
    this.projects = this.store.projects.all;
    this.organizations = this.store.organizations.all;
  }

  async ngOnInit(): Promise<void> {
    try {
      const user = await appstraxAuth.getUser();
      if (!user) return;

      this.currentUserId = user.id;
      await this.checkPermissions();
      
      // Load filters from URL on initial load
      const params = this.route.snapshot.queryParams;
      this.loadFiltersFromUrl(params);

      await this.loadAllTimeSheetEntries(); // Load all entries for global metrics
      await this.loadTimeSheetEntries();
      this.calculateSummaryMetrics();

      // Subscribe to query parameter changes (after initial load)
      // Use a flag to skip the first emission (which is the initial load)
      let isFirstEmission = true;
      this.route.queryParams
        .pipe(takeUntil(this.destroy$))
        .subscribe(params => {
          // Skip the first emission as it's the initial load
          if (isFirstEmission) {
            isFirstEmission = false;
            return;
          }
          // URL changed (e.g., browser back/forward), reload filters and entries
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

  private async checkPermissions(): Promise<void> {
    const orgUsers = this.store.orgUsers.byUserId(this.currentUserId)();
    const isOrgAdmin = orgUsers.some(ou => ou.role === OrgUserRoles.ADMIN);

    const projUsers = this.store.projUsers.byUserId(this.currentUserId)();
    const isProjAdmin = projUsers.some(pu =>
      pu.role === ProjectUserRoles.ADMIN ||
      pu.role === ProjectUserRoles.OWNER ||
      pu.role === ProjectUserRoles.REVIEWER
    );

    this.canViewAllEntries = isOrgAdmin || isProjAdmin;
    this.canApprove = isOrgAdmin || isProjAdmin;
  }

  private loadFiltersFromUrl(params: Params): void {
    const previousState = this.isInitializing;
    this.isInitializing = true;
    this.filters = this.filterUtils.parseFiltersFromParams(params, this.filters, {
      preserveOrganizationAndProject: true,
    });
    this.selectedOrganization = this.findOrganizationById(this.filters.organizationId);
    this.selectedProject = this.findProjectById(this.filters.projectId);
    this.isInitializing = previousState;
  }

  private findOrganizationById(id?: string | null): Organization | null {
    if (!id) return null;
    return this.organizations().find(org => org.id === id) ?? null;
  }

  private findProjectById(id?: string | null): Project | null {
    if (!id) return null;
    return this.projects().find(project => project.id === id) ?? null;
  }

  private syncFiltersToUrl(): void {
    if (this.isInitializing) return;
    this.filterUtils.syncFiltersToUrl(this.route, this.filters, {
      includeOrganizationAndProject: true,
    });
  }

  private async loadAllTimeSheetEntries(): Promise<void> {
    try {
      if (this.canViewAllEntries) {
        const accessibleProjectIds = this.getAccessibleProjectIds();

        if (!accessibleProjectIds.length) {
          this.allTimeSheetEntries = [];
          return;
        }

        this.allTimeSheetEntries = await this.timeSheetEntryService.getTimeSheetEntriesByProjectId(accessibleProjectIds);
      } else {
        const result = await this.timeSheetEntryService.getTimeSheetEntriesByUserId(this.currentUserId);
        this.allTimeSheetEntries = result || [];
      }
    } catch (error) {
      console.error('Error loading all time entries:', error);
      this.allTimeSheetEntries = [];
    }
  }

  private getAccessibleProjectIds(): string[] {
    const projectIds = new Set<string>();

    const orgUsers = this.store.orgUsers.byUserId(this.currentUserId)();
    for (const orgUser of orgUsers) {
      const orgProjects = this.store.orgProjects.byOrganizationId(orgUser.organizationId)();
      for (const orgProject of orgProjects) {
        projectIds.add(orgProject.projectId);
      }
    }

    const projUsers = this.store.projUsers.byUserId(this.currentUserId)();
    for (const projUser of projUsers) {
      projectIds.add(projUser.projectId);
    }

    return Array.from(projectIds);
  }

  async buildQueryFilters(): Promise<TimeSheetEntry[]> {
    let projectIds = this.getFilteredProjectIds();

    let queryList: any[] = [{ 'projectId': { [Operator.IN]: projectIds } } as any];
    if (this.filters.startDate) queryList.push({ 'date': { [Operator.GTE]: this.filters.startDate } });
    if (this.filters.endDate) queryList.push({ 'date': { [Operator.LTE]: this.filters.endDate } });


    const filterQuery = { [Operator.AND]: queryList };

    return await this.timeSheetEntryService.getByFilter(filterQuery);
  }

  getFilteredProjectIds(): String[] {
    let projectIds = this.getAccessibleProjectIds();

    if (this.filters.projectId) {
      return projectIds.filter(id => id === this.filters.projectId);
    }

    if (this.filters.organizationId) {
      const orgProjects = this.store.orgProjects.byOrganizationId(this.filters.organizationId)();
      const orgProjectIds = orgProjects.map(op => op.projectId);
      return projectIds.filter(id => orgProjectIds.includes(id));
    }

    return projectIds;

  }

  public async onFiltersChange(filters: TimeSheetFilterState): Promise<void> {
    this.filters = { ...filters }; // Create a new object to ensure change detection
    this.syncFiltersToUrl();
    await this.loadTimeSheetEntries();
  }

  public async loadTimeSheetEntries(): Promise<void> {
    try {
      this.timeSheetEntries = await this.buildQueryFilters();
      this.filteredEntries = this.filterTimeSheetEntries();
      this.calculateSummaryMetrics();
    } catch (error) {
      this.toastService.error('Error loading time entries');
    }
  }

  filterTimeSheetEntries(): TimeSheetEntry[] {
    return this.timeSheetEntries.filter(e => {
      let isTrue = true;
      if (this.filters.userId) isTrue = isTrue && e.userId === this.filters.userId;
      if (this.filters.category) isTrue = isTrue && e.category === this.filters.category;
      if (this.filters.status === 'approved') isTrue = isTrue && e.approved;
      else if (this.filters.status === 'pending') isTrue = isTrue && !e.approved;
      return isTrue;
    });
  }

  public async onOrganizationSelected(organization: Organization | null): Promise<void> {
    this.selectedOrganization = organization;
    this.filters.organizationId = organization?.id || null;
    this.selectedProject = null;
    this.filters.projectId = null; // Reset project when org changes
    this.filters.userId = ''; // Reset user filter
    this.filters.category = ''; // Reset category filter
    this.syncFiltersToUrl();
    await this.loadTimeSheetEntries();
  }

  public async onProjectSelected(project: Project | null): Promise<void> {
    this.selectedProject = project;
    this.filters.projectId = project?.id || null;
    this.filters.userId = ''; // Reset user filter when project changes
    this.filters.category = ''; // Reset category filter
    this.syncFiltersToUrl();
    await this.loadTimeSheetEntries();
  }

  public getSelectedProject(): Project | undefined {
    if (!this.filters.projectId) return undefined;
    return this.projects().find(p => p.id === this.filters.projectId);
  }

  public async approveAllPending(): Promise<void> {
    if (!this.canApprove) return;

    const pendingEntries = this.filteredEntries.filter(e => !e.approved);
    if (pendingEntries.length === 0) {
      this.toastService.info('No pending entries to approve');
      return;
    }

    try {
      for (const entry of pendingEntries) {
        entry.approved = true;
        await this.timeSheetEntryService.save(entry);
      }
      this.toastService.success(`Approved ${pendingEntries.length} time entries`);
      await this.loadAllTimeSheetEntries(); // Reload all entries for global metrics
      await this.loadTimeSheetEntries();
    } catch (error) {
      this.toastService.error('Error approving time entries');
    }
  }

  public getProjectName(projectId: string): string {
    const project = this.projects().find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  }

  public getUserName(userId: string): string {
    return userId === this.currentUserId ? 'You' : userId.substring(0, 8);
  }

  private calculateSummaryMetrics(): void {
    const allEntries = this.allTimeSheetEntries || [];
    const totalHours = allEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
    const projectCount = this.projects().length;
    const organizationCount = this.organizations().length;
    this.summaryMetrics = {
      totalHours,
      pendingCount: allEntries.filter(e => !e.approved).length,
      approvedCount: allEntries.filter(e => e.approved).length,
      projectsCount: projectCount,
      organizationsCount: organizationCount,
    };
  }

  public formatHours(hours: number): string {
    return TimeCalculationUtils.formatHours(hours);
  }
}
