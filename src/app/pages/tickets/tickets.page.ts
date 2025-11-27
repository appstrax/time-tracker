import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { KanbanBoardComponent } from '@components';
import { ChatComponent, HistoryComponent } from '@components';
import { SplitPaneComponent, SplitPaneVerticalComponent } from '@components';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.page.html',
  styleUrls: ['./tickets.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ChatComponent,
    SplitPaneComponent,
    SplitPaneVerticalComponent,
    HistoryComponent,
    KanbanBoardComponent,
  ],
})
export class TicketsPage {
  public ticketsSuggestions: any[] = [
    { icon: 'bi bi-bug', prompt: 'Create a new ticket to test my code' },
    {
      icon: 'bi bi-ticket-perforated',
      prompt: 'Complete all outstanding tickets',
    },
    {
      icon: 'bi bi-calendar-check',
      prompt: 'Generate a timesheet from all my tickets over the last month',
    },
    {
      icon: 'bi bi-ticket-perforated',
      prompt: 'Create some tickets for my Flutter app',
    },
  ];

  public ticketsContext: any = {
    page: 'tickets',
    purpose: 'Create, manage and review tickets and timelines',
    boards: ['Backlog', 'In Progress', 'Done'],
    priorities: ['Low', 'Medium', 'High', 'Critical'],
    outputs: ['New tickets', 'Backlog grooming', 'Timesheet generation']
  };

  constructor() {}
}
