import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-kpis',
  templateUrl: './kpis.page.html',
  styleUrls: ['./kpis.page.scss'],
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
export class KpisPage {
  public kpiSuggestions: any[] = [
    { icon: 'bi bi-bullseye', prompt: 'Show KPIs met this month' },
    { icon: 'bi bi-arrow-repeat', prompt: 'KPIs trending down, why?' },
    { icon: 'bi bi-people', prompt: 'Which owners need attention?' },
  ];

  constructor() {}
} 