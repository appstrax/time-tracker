import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ChatComponent,
    HistoryComponent,
    SplitPaneComponent,
    SplitPaneVerticalComponent,
  ],
})
export class StatsPage {
  public statsSuggestions: any[] = [
    { icon: 'bi bi-graph-up', prompt: 'Show velocity trend for last 6 weeks' },
    { icon: 'bi bi-activity', prompt: 'Compare coverage vs failures' },
    { icon: 'bi bi-pie-chart', prompt: 'Top contributors this month' },
  ];

  public statsContext: any = {
    page: 'stats',
    purpose: 'Explore metrics, trends and insights across the project',
    metrics: [],
    timeRange: 'last_30_days',
    comparisons: [],
    outputs: ['Charts', 'Trend analysis', 'Highlights and anomalies']
  };

  constructor() {}
} 