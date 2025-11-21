import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { appstraxAuth } from '@appstrax/services/auth';
import { ActivatedRoute, Params } from '@angular/router';
import { Component, OnInit, Signal, OnDestroy, effect, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Store } from '@state';
import { OrgUserRoles, ProjectUserRoles } from '@models';
import { TimeSheetEntry, Project, Organization, OrganizationProjects } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { SplitPaneComponent, SplitPaneVerticalComponent } from '@components';
import { OrganizationSelectorComponent } from './components/organization-selector/organization-selector.component';
import { FilterViewContainerComponent } from './components/filter-view-container/filter-view-container.component';
import { SummaryMetricsComponent, SummaryMetrics } from './components/summary-metrics/summary-metrics.component';
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
  private store: Store = inject(Store);
  private timeSheetEntryService: TimeSheetEntryService = inject(TimeSheetEntryService);
  private toastService: ToastService = inject(ToastService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private filterUtils: TimeSheetFilterUtilsService = inject(TimeSheetFilterUtilsService);

  public projects: Signal<Project[]>;
  public organizations: Signal<Organization[]>;
  public orgProjects: Signal<OrganizationProjects[]>;

  public timeSheetEntries: TimeSheetEntry[] = [];
  public allTimeSheetEntries: TimeSheetEntry[] = [];
  public filteredEntries: TimeSheetEntry[] = [];

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

  constructor() {
    this.organizations = this.store.organizations.all;
    this.projects = this.store.projects.all;
    this.orgProjects = this.store.orgProjects.all;
    effect(() => {
      if (
        this.organizations().length &&
        this.projects().length &&
        this.orgProjects().length
      ) {
        this.ngOnInit();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      if (!this.projects().length || !this.organizations().length) return;
      const user = await appstraxAuth.getUser();
      if (!user) return;

      this.currentUserId = user.id;
      await this.checkPermissions();
      const params = this.route.snapshot.queryParams;
      this.loadFiltersFromUrl(params);

      await this.loadAllTimeSheetEntries();
      await this.loadTimeSheetEntries();

      let isFirstEmission = true;
      this.route.queryParams
        .pipe(takeUntil(this.destroy$))
        .subscribe(params => {
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

  public async onOrganizationSelected(organization: Organization | null): Promise<void> {
    this.selectedOrganization = organization;
    this.filters.organizationId = organization?.id || null;
    this.selectedProject = null;
    this.filters.projectId = null;
    this.filters.userId = '';
    this.filters.category = '';
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

    const pendingEntries = this.filteredEntries.filter(e => !e.approved);
    if (!pendingEntries.length) {
      this.toastService.info('No pending entries to approve');
      return;
    }

    try {
      for (const entry of pendingEntries) {
        entry.approved = true;
        await this.timeSheetEntryService.save(entry);
      }
      this.toastService.success(`Approved ${pendingEntries.length} time entries`);
      await this.loadAllTimeSheetEntries();
      await this.loadTimeSheetEntries();
    } catch (error) {
      this.toastService.error('Error approving time entries');
    }
  }

  public getSelectedProject(): Project | undefined {
    if (!this.filters.projectId) return undefined;
    return this.projects().find(p => p.id === this.filters.projectId);
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

  private syncFiltersToUrl(): void {
    if (this.isInitializing) return;
    this.filterUtils.syncFiltersToUrl(this.route, this.filters, {
      includeOrganizationAndProject: true,
    });
  }

  private findOrganizationById(id?: string | null): Organization | null {
    if (!id) return null;
    return this.organizations().find(org => org.id === id) ?? null;
  }

  private findProjectById(id?: string | null): Project | null {
    if (!id) return null;
    return this.projects().find(project => project.id === id) ?? null;
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
    const projectIds = this.getFilteredProjectIds();
    return await this.timeSheetEntryService.getTimeSheetEntriesByProjectId(projectIds);
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

  private getFilteredProjectIds(): string[] {
    const projectIds = this.getAccessibleProjectIds();
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

  private filterTimeSheetEntries(): TimeSheetEntry[] {
    return this.timeSheetEntries.filter(e => {
      if (this.filters.startDate && e.date < this.filters.startDate) return false;
      if (this.filters.endDate && e.date > this.filters.endDate) return false;
      if (this.filters.userId && e.userId !== this.filters.userId) return false;
      if (this.filters.category && e.category !== this.filters.category) return false;
      if (this.filters.status === 'approved' && !e.approved) return false;
      if (this.filters.status === 'pending' && e.approved) return false;
      return true;
    });
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
}
