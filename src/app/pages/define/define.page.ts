import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-define',
  templateUrl: './define.page.html',
  styleUrls: ['./define.page.scss'],
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
export class DefinePage {
  public defineSuggestions: any[] = [
    {
      icon: 'bi bi-magic',
      prompt: 'Scaffold and host a new project with Angular',
    },
    {
      icon: 'bi bi-calculator',
      prompt: 'Create a quoting system for my business',
    },
    {
      icon: 'bi bi-code-square',
      prompt: 'Generate a simple landing page with HTML and CSS',
    },
    { icon: 'bi bi-globe', prompt: 'Recommend a framework' },
    { icon: 'bi bi-file-earmark-bar-graph', prompt: 'Create a report' },
    {
      icon: 'bi bi-ticket-perforated',
      prompt:
        'Define some critical tickets for my project, I need to cover all the bases',
    },
  ];

  constructor() {}
}
