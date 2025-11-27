import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-quality',
  templateUrl: './quality.page.html',
  styleUrls: ['./quality.page.scss'],
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
export class QualityPage {
  public qualitySuggestions: any[] = [
    { icon: 'bi bi-bar-chart', prompt: 'What is current coverage?' },
    { icon: 'bi bi-bug', prompt: 'List failing tests and owners' },
    { icon: 'bi bi-braces', prompt: 'Summarize lint issues by category' },
  ];

  public qualityContext: any = {
    page: 'quality',
    purpose: 'Track and improve code quality and test health',
    coverage: {},
    lintIssues: [],
    failingTests: [],
    outputs: ['Coverage trend', 'Top lint categories', 'Failure breakdown']
  };

  constructor() {}
} 