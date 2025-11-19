import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricCardComponent } from '../../../../../components/metric-card/metric-card.component';

export interface SummaryMetrics {
  totalHours: number;
  pendingCount: number;
  approvedCount: number;
  projectsCount: number;
  organizationsCount: number;
}

interface MetricCardConfig {
  label: string;
  valueKey: keyof SummaryMetrics;
  iconClass: string;
  valueSuffix?: string;
  formatter?: (value: number) => string;
}

@Component({
  selector: 'app-summary-metrics',
  standalone: true,
  imports: [CommonModule, MetricCardComponent],
  templateUrl: './summary-metrics.component.html',
  styleUrl: './summary-metrics.component.scss'
})
export class SummaryMetricsComponent {
  @Input() metrics: SummaryMetrics = {
    totalHours: 0,
    pendingCount: 0,
    approvedCount: 0,
    projectsCount: 0,
    organizationsCount: 0,
  };

  public metricCardConfigs: MetricCardConfig[] = [
    {
      label: 'Organizations',
      valueKey: 'organizationsCount',
      iconClass: 'bi bi-building text-success'
    },
    {
      label: 'Projects',
      valueKey: 'projectsCount',
      iconClass: 'bi bi-folder text-success'
    },
    {
      label: 'Total Hours',
      valueKey: 'totalHours',
      iconClass: 'bi bi-clock-history text-primary',
      valueSuffix: 'h',
      formatter: (value: number) => value.toFixed(1)
    },
    {
      label: 'Pending',
      valueKey: 'pendingCount',
      iconClass: 'bi bi-hourglass-split text-warning'
    },
  ];

  public formatCardValue(config: MetricCardConfig): string | number {
    const rawValue = this.metrics[config.valueKey];
    if (typeof rawValue !== 'number') {
      return rawValue ?? '';
    }
    return config.formatter ? config.formatter(rawValue) : rawValue;
  }
}

