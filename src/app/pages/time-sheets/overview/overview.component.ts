import { Component, OnInit, Signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Store } from '@state';
import { TimeSheetEntry, Project, User, Organization } from '@models';
import { OrgUserRoles, ProjectUserRoles } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { SplitPaneComponent, SplitPaneVerticalComponent } from '@components';
import { OrganizationSelectorComponent } from './components/organization-selector/organization-selector.component';
import { FilterViewContainerComponent } from './components/filter-view-container/filter-view-container.component';
import { SummaryMetricsComponent, SummaryMetrics } from './components/summary-metrics/summary-metrics.component';
import { appstraxAuth } from '@appstrax/services/auth';
import { TimeCalculationUtils } from 'src/app/utils/time-calculation-utils';

interface TimeSheetFilters {
  organizationId: string | null;
  projectId: string | null;
  userId: string | null;
  status: 'all' | 'approved' | 'pending';
  dateRange: 'week' | 'month' | 'year' | 'all' | 'custom';
  startDate: Date | null;
  endDate: Date | null;
  category: string | null;
}


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
export class OverviewComponent implements OnInit {
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

  public filters: TimeSheetFilters = {
    organizationId: null,
    projectId: null,
    userId: null,
    status: 'all',
    dateRange: 'month',
    startDate: null,
    endDate: null,
    category: null,
  };

  public summaryMetrics: SummaryMetrics = {
    totalHours: 0,
    pendingCount: 0,
    approvedCount: 0,
    projectsCount: 0,
    organizationsCount: 0,
  };

  public timesheetSuggestions: any[] = [
    { icon: 'bi bi-clock-history', prompt: 'Show my time entries for this week' },
    { icon: 'bi bi-check-circle', prompt: 'Approve all pending time entries' },
    { icon: 'bi bi-graph-up', prompt: 'Show time spent by project this month' },
    { icon: 'bi bi-calendar-check', prompt: 'Generate a report of all time entries' },
  ];

  constructor(
    private store: Store,
    private timeSheetEntryService: TimeSheetEntryService,
    private toastService: ToastService,
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
      await this.initializeDateRange();
      await this.loadAllTimeSheetEntries(); // Load all entries for global metrics
      await this.loadTimeSheetEntries();
      this.calculateSummaryMetrics();

      this.isLoading = false;
    } catch (error) {
      this.toastService.error('Error loading timesheet overview');
      this.isLoading = false;
    }
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

  private async initializeDateRange(): Promise<void> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    this.filters.startDate = startOfMonth;
    this.filters.endDate = endOfMonth;
  }

  private async loadAllTimeSheetEntries(): Promise<void> {
    try {
      if (this.canViewAllEntries) {
        const accessibleProjectIds = this.getAccessibleProjectIds();

        if (!accessibleProjectIds.length) {
          this.allTimeSheetEntries = [];
          return;
        }

        const allEntries: TimeSheetEntry[] = [];
        for (const projectId of accessibleProjectIds) {
          const entries = await this.timeSheetEntryService.getTimeSheetEntriesByProjectId(projectId);
          allEntries.push(...entries);
        }
        this.allTimeSheetEntries = allEntries;
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

  public async loadTimeSheetEntries(): Promise<void> {
    try {
      const startDate = this.filters.startDate || new Date();
      const endDate = this.filters.endDate || new Date();

      if (this.filters.projectId) {
        this.timeSheetEntries = await this.timeSheetEntryService.getTimeSheetEntriesByProjectId(
          this.filters.projectId
        );
      } else if (this.filters.organizationId) {
        const orgProjects = this.store.orgProjects.byOrganizationId(this.filters.organizationId)();
        const projectIds = orgProjects.map(op => op.projectId);
        if (projectIds.length) {
          const allEntries: TimeSheetEntry[] = [];
          for (const projectId of projectIds) {
            const entries = await this.timeSheetEntryService.getTimeSheetEntriesByProjectId(projectId);
            allEntries.push(...entries);
          }
          this.timeSheetEntries = allEntries;
        } else {
          this.timeSheetEntries = [];
        }
      } else if (this.canViewAllEntries && this.filters.userId) {
        this.timeSheetEntries = await this.timeSheetEntryService.getTimeSheetEntriesByUserIdAndDateRange(
          this.filters.userId,
          startDate,
          endDate
        );
      } else if (this.canViewAllEntries) {
        this.timeSheetEntries = await this.timeSheetEntryService.getTimeSheetEntriesByUserIdAndDateRange(
          this.currentUserId,
          startDate,
          endDate
        );
      } else {
        this.timeSheetEntries = await this.timeSheetEntryService.getTimeSheetEntriesByUserIdAndDateRange(
          this.currentUserId,
          startDate,
          endDate
        );
      }

      this.applyFilters();
    } catch (error) {
      this.toastService.error('Error loading time entries');
    }
  }

  public applyFilters(): void {
    let filtered = [...this.timeSheetEntries];

    if (this.filters.organizationId && !this.filters.projectId) {
      const orgProjects = this.store.orgProjects.byOrganizationId(this.filters.organizationId)();
      const projectIds = orgProjects.map(op => op.projectId);
      filtered = filtered.filter(entry => projectIds.includes(entry.projectId));
    }

    if (this.filters.projectId) {
      filtered = filtered.filter(entry => entry.projectId === this.filters.projectId);
    }

    if (this.filters.userId) {
      filtered = filtered.filter(entry => entry.userId === this.filters.userId);
    }

    if (this.filters.status === 'approved') {
      filtered = filtered.filter(entry => entry.approved);
    } else if (this.filters.status === 'pending') {
      filtered = filtered.filter(entry => !entry.approved);
    }

    if (this.filters.category) {
      filtered = filtered.filter(entry => entry.category === this.filters.category);
    }

    if (this.filters.startDate && this.filters.endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= this.filters.startDate! && entryDate <= this.filters.endDate!;
      });
    }

    this.filteredEntries = filtered;
    this.calculateSummaryMetrics();
  }

  public onOrganizationSelected(organization: Organization | null): void {
    this.selectedOrganization = organization;
    this.filters.organizationId = organization?.id || null;
    this.selectedProject = null;
    this.filters.projectId = null; // Reset project when org changes
    this.filters.userId = null; // Reset user filter
    this.filters.category = null; // Reset category filter
    this.loadTimeSheetEntries();
  }

  public onProjectSelected(project: Project | null): void {
    this.selectedProject = project;
    this.filters.projectId = project?.id || null;
    this.filters.userId = null; // Reset user filter when project changes
    this.filters.category = null; // Reset category filter
    this.loadTimeSheetEntries();
  }

  public getSelectedProject(): Project | undefined {
    if (!this.filters.projectId) return undefined;
    return this.projects().find(p => p.id === this.filters.projectId);
  }

  public onStatusChange(): void {
    this.applyFilters();
  }

  public onCategoryChange(category: string | null): void {
    this.filters.category = category;
    this.applyFilters();
  }

  public onUserChange(userId: string | null): void {
    this.filters.userId = userId;
    this.applyFilters();
  }

  public onDateRangeChange(): void {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (this.filters.dateRange) {
      case 'week':
        const dayOfWeek = today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'all':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        startDate = new Date(0);
        break;
      case 'custom':
        startDate = this.filters.startDate || new Date();
        endDate = this.filters.endDate || new Date();
        break;
      default:
        return;
    }

    this.filters.startDate = startDate;
    this.filters.endDate = endDate;
    this.loadTimeSheetEntries();
  }

  public async approveEntry(entry: TimeSheetEntry): Promise<void> {
    if (!this.canApprove) return;

    try {
      entry.approved = true;
      await this.timeSheetEntryService.save(entry);
      this.toastService.success('Time entry approved');
      await this.loadTimeSheetEntries();
    } catch (error) {
      this.toastService.error('Error approving time entry');
    }
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
