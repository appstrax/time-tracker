import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { TimeSheetEntry, Project, User } from '@models';
import { ToastService } from '@services';
import {
  TimeSheetDisplayUtil,
  TimeSheetExportUtil,
  storeTimeSheetProjectId,
} from '@utils';

@Component({
  selector: 'app-filter-view-summary',
  standalone: true,
  imports: [],
  templateUrl: './filter-view-summary.component.html',
  styleUrl: './filter-view-summary.component.scss',
})
export class FilterViewSummaryComponent {
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly projects = input<Project[]>([]);
  public readonly users = input<User[]>([]);
  public readonly showExport = input(false);
  public readonly linkProjectsToTimeSheet = input(false);
  public readonly compact = input(false);

  public displayUtils = inject(TimeSheetDisplayUtil);
  private readonly exportUtil = inject(TimeSheetExportUtil);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  public readonly entriesByProject = computed<
    {
      projectId: string;
      projectName: string;
      hours: number;
      approvedHours: number;
      pendingHours: number;
      count: number;
    }[]
  >(() => {
    const projectMap = new Map<
      string,
      {
        projectName: string;
        hours: number;
        approvedHours: number;
        pendingHours: number;
        count: number;
      }
    >();

    this.entries().forEach((entry) => {
      const projectName = this.displayUtils.getProjectName(
        entry.projectId,
        this.projects(),
      );
      if (!projectMap.has(entry.projectId)) {
        projectMap.set(entry.projectId, {
          projectName,
          hours: 0,
          approvedHours: 0,
          pendingHours: 0,
          count: 0,
        });
      }

      const project = projectMap.get(entry.projectId)!;
      project.hours += entry.hours;
      if (entry.approved) {
        project.approvedHours += entry.hours;
      } else {
        project.pendingHours += entry.hours;
      }
      project.count += 1;
    });

    return Array.from(projectMap.entries())
      .map(([projectId, data]) => ({ projectId, ...data }))
      .sort((a, b) => b.hours - a.hours);
  });

  public openTimeSheetForProject(projectId: string): void {
    storeTimeSheetProjectId(projectId);
    void this.router.navigate(['/time-sheet']);
  }

  public exportProject(projectId: string, projectName: string): void {
    const projectEntries = this.entries().filter(
      (entry) => entry.projectId === projectId,
    );
    if (!projectEntries.length) {
      this.toast.info(`No entries to export for ${projectName}`);
      return;
    }

    this.exportUtil.exportProjectEntries(
      projectId,
      this.entries(),
      this.projects(),
      this.users(),
      this.formatDate.bind(this),
    );
  }

  private formatDate(date?: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
