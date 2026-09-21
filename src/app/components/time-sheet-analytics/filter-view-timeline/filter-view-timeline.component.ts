import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimeSheetEntry, Project } from '@models';
import { TimeSheetDisplayUtil } from '@utils';

@Component({
  selector: 'app-filter-view-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-view-timeline.component.html',
  styleUrl: './filter-view-timeline.component.scss',
})
export class FilterViewTimelineComponent {
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly projects = input<Project[]>([]);

  public displayUtils = inject(TimeSheetDisplayUtil);

  public readonly timelineData = computed(() => {
    const dateMap = new Map<
      string,
      { hours: number; approvedHours: number; pendingHours: number }
    >();

    this.entries().forEach((entry) => {
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
        ...data,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  public readonly maxHours = computed(() => {
    const timeline = this.timelineData();
    if (!timeline.length) return 1;
    return Math.max(...timeline.map((day) => day.hours), 1);
  });
}
