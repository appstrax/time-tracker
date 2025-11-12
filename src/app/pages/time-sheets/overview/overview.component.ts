import { Component, OnInit, Signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Store } from '@state';
import { TimeSheetEntry, Project, User } from '@models';
import { OrgUserRoles, ProjectUserRoles } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { ChatComponent, HistoryComponent, SplitPaneComponent, SplitPaneVerticalComponent } from '@components';
import { ProjectDropdownComponent } from '@components';
import { appstraxAuth } from '@appstrax/services/auth';

interface TimeSheetFilters {
  projectId: string | null;
  userId: string | null;
  status: 'all' | 'approved' | 'pending';
  dateRange: 'week' | 'month' | 'custom';
  startDate: Date | null;
  endDate: Date | null;
}

interface SummaryMetrics {
  totalHours: number;
  totalHoursThisWeek: number;
  totalHoursThisMonth: number;
  pendingCount: number;
  approvedCount: number;
  projectsCount: number;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChatComponent,
    HistoryComponent,
    SplitPaneComponent,
    SplitPaneVerticalComponent,
    ProjectDropdownComponent,
  ],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit {
  public projects: Signal<Project[]>;
  public timeSheetEntries: TimeSheetEntry[] = [];
  public filteredEntries: TimeSheetEntry[] = [];
  public allUsers: User[] = []; // For admin view

  public isLoading: boolean = true;
  public currentUserId: string = '';
  public canViewAllEntries: boolean = false;
  public canApprove: boolean = false;

  public filters: TimeSheetFilters = {
    projectId: null,
    userId: null,
    status: 'all',
    dateRange: 'month',
    startDate: null,
    endDate: null,
  };

  public summaryMetrics: SummaryMetrics = {
    totalHours: 0,
    totalHoursThisWeek: 0,
    totalHoursThisMonth: 0,
    pendingCount: 0,
    approvedCount: 0,
    projectsCount: 0,
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
  }

  async ngOnInit(): Promise<void> {
    try {
      const user = await appstraxAuth.getUser();
      if (!user) return;

      this.currentUserId = user.id;
      await this.checkPermissions();
      await this.initializeDateRange();
      await this.loadTimeSheetEntries();
      this.calculateSummaryMetrics();

      this.isLoading = false;
    } catch (error) {
      this.toastService.error('Error loading timesheet overview');
      this.isLoading = false;
    }
  }

  private async checkPermissions(): Promise<void> {
    // Check organization admin role
    const orgUsers = this.store.orgUsers.byUserId(this.currentUserId)();
    const isOrgAdmin = orgUsers.some(ou => ou.role === OrgUserRoles.ADMIN);

    // Check project admin/owner/reviewer roles
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

  public async loadTimeSheetEntries(): Promise<void> {
    try {
      if (this.canViewAllEntries && this.filters.projectId) {
        // Load all entries for a project
        this.timeSheetEntries = await this.timeSheetEntryService.getTimeSheetEntriesByProjectId(
          this.filters.projectId
        );
      } else if (this.canViewAllEntries && this.filters.userId) {
        // Load entries for a specific user (admin view)
        const startDate = this.filters.startDate || new Date();
        const endDate = this.filters.endDate || new Date();
        this.timeSheetEntries = await this.timeSheetEntryService.getTimeSheetEntriesByUserIdAndDateRange(
          this.filters.userId,
          startDate,
          endDate
        );
      } else {
        // Load user's own entries
        const startDate = this.filters.startDate || new Date();
        const endDate = this.filters.endDate || new Date();
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

    // Filter by project
    if (this.filters.projectId) {
      filtered = filtered.filter(entry => entry.projectId === this.filters.projectId);
    }

    // Filter by user (for admin view)
    if (this.filters.userId) {
      filtered = filtered.filter(entry => entry.userId === this.filters.userId);
    }

    // Filter by status
    if (this.filters.status === 'approved') {
      filtered = filtered.filter(entry => entry.approved);
    } else if (this.filters.status === 'pending') {
      filtered = filtered.filter(entry => !entry.approved);
    }

    // Filter by date range
    if (this.filters.startDate && this.filters.endDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= this.filters.startDate! && entryDate <= this.filters.endDate!;
      });
    }

    this.filteredEntries = filtered;
    this.calculateSummaryMetrics();
  }

  public onProjectSelected(project: Project | null): void {
    this.filters.projectId = project?.id || null;
    this.filters.userId = null; // Reset user filter when project changes
    this.loadTimeSheetEntries();
  }

  public getSelectedProject(): Project | undefined {
    if (!this.filters.projectId) return undefined;
    return this.projects().find(p => p.id === this.filters.projectId);
  }

  public onStatusChange(): void {
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
    // In a real app, you'd fetch user names from a user service
    return userId === this.currentUserId ? 'You' : userId.substring(0, 8);
  }

  private calculateSummaryMetrics(): void {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    this.summaryMetrics = {
      totalHours: this.filteredEntries.reduce((sum, e) => sum + e.hours, 0),
      totalHoursThisWeek: this.filteredEntries
        .filter(e => new Date(e.date) >= startOfWeek)
        .reduce((sum, e) => sum + e.hours, 0),
      totalHoursThisMonth: this.filteredEntries
        .filter(e => new Date(e.date) >= startOfMonth)
        .reduce((sum, e) => sum + e.hours, 0),
      pendingCount: this.filteredEntries.filter(e => !e.approved).length,
      approvedCount: this.filteredEntries.filter(e => e.approved).length,
      projectsCount: new Set(this.filteredEntries.map(e => e.projectId)).size,
    };
  }

  public formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  public formatHours(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) return `${wholeHours}h`;
    return `${wholeHours}h ${minutes}m`;
  }
}
