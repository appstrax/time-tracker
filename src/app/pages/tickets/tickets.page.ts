import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent } from '../../components/chat/chat.component';
import { SplitPaneComponent } from '../../components/split-pane/split-pane.component';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.page.html',
  styleUrls: ['./tickets.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, ChatComponent, SplitPaneComponent],
})
export class TicketsPage {
  public ticketsSuggestions: any[] = [
    { icon: 'bi bi-bug', prompt: 'Create a new ticket to test my code' },
    { icon: 'bi bi-ticket-perforated', prompt: 'Complete all outstanding tickets' },
    { icon: 'bi bi-calendar-check', prompt: 'Generate a timesheet from all my tickets over the last month' },
    { icon: 'bi bi-ticket-perforated', prompt: 'Create some tickets for my Flutter app' },
  ];

  constructor() {}
} 