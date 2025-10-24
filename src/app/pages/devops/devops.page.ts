import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-devops',
  templateUrl: './devops.page.html',
  styleUrls: ['./devops.page.scss'],
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
export class DevopsPage {
  public devopsSuggestions: any[] = [
    { icon: 'bi bi-diagram-3', prompt: 'Show latest pipeline runs' },
    { icon: 'bi bi-cloud-arrow-up', prompt: 'List recent deployments' },
    { icon: 'bi bi-exclamation-triangle', prompt: 'Any failing jobs or errors?' },
  ];

  constructor() {}
} 