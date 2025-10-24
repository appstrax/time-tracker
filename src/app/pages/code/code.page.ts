import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-code',
  templateUrl: './code.page.html',
  styleUrls: ['./code.page.scss'],
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
export class CodePage {
  public codeSuggestions: any[] = [
    { icon: 'bi bi-code', prompt: 'Generate a React component for a card UI' },
    { icon: 'bi bi-bug', prompt: 'Explain why this test is failing' },
    { icon: 'bi bi-gear', prompt: 'Add a GitHub Action to run tests' },
  ];

  constructor() {}
} 