import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SummaryMetrics {
  totalHours: number;
  pendingCount: number;
  approvedCount: number;
  projectsCount: number;
  organizationsCount: number;
}

@Component({
  selector: 'app-summary-metrics',
  standalone: true,
  imports: [CommonModule],
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
}

