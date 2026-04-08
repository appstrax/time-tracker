import { Component, Input, inject } from '@angular/core';

import { TimeSheetEntry, Project } from '@models';
import { TimeSheetDisplayUtil } from '@utils';

@Component({
  selector: 'app-filter-view-summary',
  standalone: true,
  imports: [],
  templateUrl: './filter-view-summary.component.html',
  styleUrl: './filter-view-summary.component.scss',
})
export class FilterViewSummaryComponent {
  @Input() entries: TimeSheetEntry[] = [];
  @Input() projects: Project[] = [];

  public displayUtils = inject(TimeSheetDisplayUtil);

  public getEntriesByProject(): {
    projectId: string;
    projectName: string;
    hours: number;
    approvedHours: number;
    pendingHours: number;
    count: number;
  }[] {
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

    this.entries.forEach((entry) => {
      const projectName = this.displayUtils.getProjectName(
        entry.projectId,
        this.projects,
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
  }
}
