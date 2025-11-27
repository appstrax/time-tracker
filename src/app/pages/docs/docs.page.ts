import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.page.html',
  styleUrls: ['./docs.page.scss'],
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
export class DocsPage {
  public docsSuggestions: any[] = [
    { icon: 'bi bi-journal-text', prompt: 'Draft a README for the project' },
    { icon: 'bi bi-list-task', prompt: 'Outline the API endpoints' },
    { icon: 'bi bi-diagram-3', prompt: 'Create an architecture overview' },
  ];

  public docsContext: any = {
    page: 'docs',
    purpose: 'Draft and curate project documentation',
    documents: [],
    styleGuide: 'concise',
    outputs: ['README', 'API outline', 'Architecture overview']
  };

  constructor() {}
} 