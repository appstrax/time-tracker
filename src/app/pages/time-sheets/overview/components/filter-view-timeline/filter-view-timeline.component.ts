import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeSheetEntry, Project } from '@models';
import { Store } from '@state';
import { TimeSheetDisplayUtilsService } from '../../services/time-sheet-display-utils.service';


@Component({
  selector: 'app-filter-view-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-view-timeline.component.html',
  styleUrl: './filter-view-timeline.component.scss'
})
export class FilterViewTimelineComponent implements OnInit {
  @Input() entries: TimeSheetEntry[] = [];
  @Input() projects: Project[] = [];

  private store = inject(Store);
  public displayUtils = inject(TimeSheetDisplayUtilsService);

  ngOnInit(): void {
    if (!this.projects.length) {
      this.projects = this.store.projects.all();
    }
  }

  public getTimelineData(): { date: Date; hours: number; approvedHours: number; pendingHours: number }[] {
    const dateMap = new Map<string, { hours: number; approvedHours: number; pendingHours: number }>();

    this.entries.forEach(entry => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { hours: 0, approvedHours: 0, pendingHours: 0 });
      }
      const data = dateMap.get(dateKey)!;
      data.hours += entry.hours;
      if (entry.approved) {
        data.approvedHours += entry.hours;
      } else {
        data.pendingHours += entry.hours;
      }
    });

    return Array.from(dateMap.entries())
      .map(([dateKey, data]) => ({
        date: new Date(dateKey),
        ...data
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  public getMaxHours(): number {
    const timeline = this.getTimelineData();
    if (!timeline.length) return 1;
    return Math.max(...timeline.map(d => d.hours), 1);
  }
}

