import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-testing',
  templateUrl: './testing.page.html',
  styleUrls: ['./testing.page.scss'],
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
export class TestingPage {
  public testingSuggestions: any[] = [
    { icon: 'bi bi-play', prompt: 'Run all unit tests' },
    { icon: 'bi bi-clipboard2-check', prompt: 'Show the last test run summary' },
    { icon: 'bi bi-graph-up', prompt: 'List flaky tests' },
  ];

  constructor() {}
} 