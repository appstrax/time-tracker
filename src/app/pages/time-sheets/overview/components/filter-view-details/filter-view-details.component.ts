import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeSheetEntry, Project } from '@models';
import { Store } from '@state';
import { TimeCalculationUtils } from 'src/app/utils/time-calculation-utils';

@Component({
  selector: 'app-filter-view-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-view-details.component.html',
  styleUrl: './filter-view-details.component.scss'
})
export class FilterViewDetailsComponent implements OnInit {
  @Input() entries: TimeSheetEntry[] = [];
  @Input() projects: Project[] = [];

  private store = inject(Store);

  ngOnInit(): void {
    if (!this.projects.length) this.projects = this.store.projects.all();
  }

  public getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  }

  public formatHours(hours: number): string {
    return TimeCalculationUtils.formatHours(hours);
  }

  public getEntriesByDate(): { date: Date; entries: TimeSheetEntry[] }[] {
    const dateMap = new Map<string, TimeSheetEntry[]>();

    this.entries.forEach(entry => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(entry);
    });

    return Array.from(dateMap.entries())
      .map(([dateKey, entries]) => ({
        date: new Date(dateKey),
        entries: entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}

