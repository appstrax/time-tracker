import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-project',
  templateUrl: './project.page.html',
  styleUrls: ['./project.page.scss'],
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
export class ProjectPage {
  public projectSuggestions: any[] = [
    { icon: 'bi bi-kanban', prompt: 'Show milestones and progress' },
    { icon: 'bi bi-flag', prompt: 'List current risks and owners' },
    { icon: 'bi bi-diagram-3', prompt: 'Summarize dependencies' },
  ];

  constructor() {}
} 