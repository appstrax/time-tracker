import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-guardrails',
  templateUrl: './guardrails.page.html',
  styleUrls: ['./guardrails.page.scss'],
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
export class GuardrailsPage {
  public guardrailSuggestions: any[] = [
    { icon: 'bi bi-shield', prompt: 'List current violations' },
    { icon: 'bi bi-tools', prompt: 'Propose auto-fixes for top issues' },
    { icon: 'bi bi-toggles', prompt: 'Show rule configuration' },
  ];

  constructor() {}
} 