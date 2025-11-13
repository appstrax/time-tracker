import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-db-design',
  templateUrl: './db-design.page.html',
  styleUrls: ['./db-design.page.scss'],
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
export class DbDesignPage {
  public dbDesignSuggestions: any[] = [
    { icon: 'bi bi-diagram-3', prompt: 'Draft an ER diagram for my app' },
    { icon: 'bi bi-table', prompt: 'Propose tables and fields for users and roles' },
    { icon: 'bi bi-key', prompt: 'Suggest primary and foreign keys for these entities' },
    { icon: 'bi bi-boxes', prompt: 'Normalize this schema to 3NF' },
    { icon: 'bi bi-lightning', prompt: 'Denormalize for analytics and reporting' },
    { icon: 'bi bi-shield-lock', prompt: 'Recommend security and PII handling in the schema' },
  ];
}


