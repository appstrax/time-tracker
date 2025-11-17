import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeSheetEntry, Project } from '@models';
import { Store } from '@state';
import { TimeCalculationUtils } from 'src/app/utils/time-calculation-utils';

@Component({
  selector: 'app-filter-view-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-view-summary.component.html',
  styleUrl: './filter-view-summary.component.scss'
})
export class FilterViewSummaryComponent implements OnInit {
  @Input() entries: TimeSheetEntry[] = [];
  @Input() projects: Project[] = [];

  private store = inject(Store);

  ngOnInit(): void {
    if (this.projects.length === 0) {
      this.projects = this.store.projects.all();
    }
  }

  public getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  }

  public getEntriesByProject(): { projectId: string; projectName: string; hours: number; approvedHours: number; pendingHours: number; count: number }[] {
    const projectMap = new Map<string, { projectName: string; hours: number; approvedHours: number; pendingHours: number; count: number }>();

    this.entries.forEach(entry => {
      const projectName = this.getProjectName(entry.projectId);
      if (!projectMap.has(entry.projectId)) {
        projectMap.set(entry.projectId, {
          projectName,
          hours: 0,
          approvedHours: 0,
          pendingHours: 0,
          count: 0
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

  public formatHours(hours: number): string {
    return TimeCalculationUtils.formatHours(hours);
  }
}

