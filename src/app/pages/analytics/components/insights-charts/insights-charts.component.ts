import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { Project, TimeSheetEntry } from '@models';
import { buildProjectColorMap } from '@utils';

interface HoursBucket {
  key: string;
  label: string;
  approved: number;
  pending: number;
  total: number;
  heightPercent: number;
}

interface ProjectShare {
  id: string;
  name: string;
  color: string;
  hours: number;
  percent: number;
  widthPercent: number;
}

const MAX_BUCKETS = 14;
const MAX_PROJECTS = 5;

@Component({
  selector: 'app-insights-charts',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './insights-charts.component.html',
  styleUrl: './insights-charts.component.scss',
})
export class InsightsChartsComponent {
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly projects = input<Project[]>([]);

  public readonly granularity = computed<'day' | 'month'>(() => {
    const times = this.entries().map((e) => new Date(e.date).getTime());
    if (!times.length) return 'day';
    const spanDays = (Math.max(...times) - Math.min(...times)) / 86_400_000;
    return spanDays > 45 ? 'month' : 'day';
  });

  public readonly subtitle = computed(() =>
    this.granularity() === 'day' ? 'Daily total' : 'Monthly total',
  );

  public readonly buckets = computed<HoursBucket[]>(() => {
    const byKey = new Map<string, HoursBucket & { sort: number }>();
    const month = this.granularity() === 'month';

    for (const entry of this.entries()) {
      const date = new Date(entry.date);
      const key = month
        ? `${date.getFullYear()}-${date.getMonth()}`
        : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      let bucket = byKey.get(key);
      if (!bucket) {
        bucket = {
          key,
          sort: month
            ? new Date(date.getFullYear(), date.getMonth(), 1).getTime()
            : new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
              ).getTime(),
          label: month
            ? date.toLocaleDateString(undefined, { month: 'short' })
            : date.toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
              }),
          approved: 0,
          pending: 0,
          total: 0,
          heightPercent: 0,
        };
        byKey.set(key, bucket);
      }
      const hours = entry.hours || 0;
      if (entry.approved) bucket.approved += hours;
      else bucket.pending += hours;
      bucket.total += hours;
    }

    const list = [...byKey.values()]
      .sort((a, b) => a.sort - b.sort)
      .slice(-MAX_BUCKETS);
    const max = Math.max(1, ...list.map((b) => b.total));
    return list.map((b) => ({ ...b, heightPercent: (b.total / max) * 100 }));
  });

  public readonly projectShares = computed<ProjectShare[]>(() => {
    const colors = buildProjectColorMap(this.projects());
    const names = new Map(this.projects().map((p) => [p.id, p.name]));
    const totals = new Map<string, number>();
    let all = 0;
    for (const entry of this.entries()) {
      const hours = entry.hours || 0;
      totals.set(entry.projectId, (totals.get(entry.projectId) ?? 0) + hours);
      all += hours;
    }
    const sorted = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_PROJECTS);
    const top = sorted[0]?.[1] || 1;
    return sorted.map(([id, hours]) => ({
      id,
      name: names.get(id) ?? 'Unknown project',
      color: colors.get(id) ?? 'var(--color-primary)',
      hours,
      percent: all ? Math.round((hours / all) * 100) : 0,
      widthPercent: (hours / top) * 100,
    }));
  });
}
