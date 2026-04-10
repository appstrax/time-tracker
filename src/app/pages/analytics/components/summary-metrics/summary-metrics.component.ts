import { Component, computed, input } from '@angular/core';

import { MetricCardComponent } from '../metric-card/metric-card.component';
import { Project, TimeSheetEntry } from '@models';

export interface SummaryMetrics {
  totalHours: number;
  pendingCount: number;
  approvedCount: number;
  projectsCount: number;
}

interface MetricCardConfig {
  label: string;
  valueKey: keyof SummaryMetrics;
  iconClass: string;
  valueSuffix?: string;
  formatter?: (value: number) => string;
}

interface MetricCardViewModel extends MetricCardConfig {
  value: string | number;
}

@Component({
  selector: 'app-summary-metrics',
  standalone: true,
  imports: [MetricCardComponent],
  templateUrl: './summary-metrics.component.html',
  styleUrl: './summary-metrics.component.scss',
})
export class SummaryMetricsComponent {
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly projects = input<Project[]>([]);

  public readonly metrics = computed<SummaryMetrics>(() => {
    const entries = this.entries();
    const totalHours = entries.reduce(
      (sum, entry) => sum + (entry.hours || 0),
      0,
    );

    return {
      totalHours,
      pendingCount: entries.filter((entry) => !entry.approved).length,
      approvedCount: entries.filter((entry) => entry.approved).length,
      projectsCount: this.projects().length,
    };
  });

  public readonly metricCardConfigs: MetricCardConfig[] = [
    {
      label: 'Projects',
      valueKey: 'projectsCount',
      iconClass: 'bi bi-folder text-success',
    },
    {
      label: 'Total Hours',
      valueKey: 'totalHours',
      iconClass: 'bi bi-clock-history text-primary',
      valueSuffix: 'h',
      formatter: (value: number) => value.toFixed(1),
    },
    {
      label: 'Pending',
      valueKey: 'pendingCount',
      iconClass: 'bi bi-hourglass-split text-warning',
    },
  ];

  public readonly cards = computed<MetricCardViewModel[]>(() =>
    this.metricCardConfigs.map((config) => ({
      ...config,
      value: this.formatCardValue(config),
    })),
  );

  private formatCardValue(config: MetricCardConfig): string | number {
    const rawValue = this.metrics()[config.valueKey];
    return config.formatter ? config.formatter(rawValue) : rawValue;
  }
}
