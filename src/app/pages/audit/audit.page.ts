import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.page.html',
  styleUrls: ['./audit.page.scss'],
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
export class AuditPage {
  public auditSuggestions: any[] = [
    { icon: 'bi bi-clipboard2-data', prompt: "Show today's audit events" },
    { icon: 'bi bi-filter', prompt: 'Filter by user Alex' },
    { icon: 'bi bi-download', prompt: 'Export last 24h' },
  ];

  constructor() {}
} 