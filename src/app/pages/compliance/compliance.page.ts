import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-compliance',
  templateUrl: './compliance.page.html',
  styleUrls: ['./compliance.page.scss'],
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
export class CompliancePage {
  public complianceSuggestions: any[] = [
    { icon: 'bi bi-shield-check', prompt: 'What policies need attention?' },
    { icon: 'bi bi-calendar-event', prompt: 'Upcoming deadlines' },
    { icon: 'bi bi-folder-check', prompt: 'Evidence required for SOC2' },
  ];

  constructor() {}
} 