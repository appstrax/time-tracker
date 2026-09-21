import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimeSheetEntry, Project } from '@models';
import { TimeSheetDisplayUtil } from '@utils';

@Component({
  selector: 'app-filter-view-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-view-details.component.html',
  styleUrl: './filter-view-details.component.scss',
})
export class FilterViewDetailsComponent {
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly projects = input<Project[]>([]);

  public displayUtils = inject(TimeSheetDisplayUtil);

  public readonly entriesByDate = computed(() => {
    const dateMap = new Map<string, TimeSheetEntry[]>();

    this.entries().forEach((entry) => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(entry);
    });

    return Array.from(dateMap.entries())
      .map(([dateKey, entries]) => ({
        date: new Date(dateKey),
        entries: entries.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  });
}
