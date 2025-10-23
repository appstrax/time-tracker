import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SplitPaneComponent } from '../../components/split-pane/split-pane.component';
import { InnerSplitPaneComponent } from '../../components/inner-split-pane/inner-split-pane.component';
import { SplitPaneVerticalComponent } from '../../components/split-pane-vertical/split-pane-vertical.component';
import { ChatComponent } from '../../components/chat/chat.component';
import { HistoryComponent } from '../../components/history/history.component';

@Component({
  selector: 'app-quotations',
  templateUrl: './quotations.page.html',
  styleUrls: ['./quotations.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, SplitPaneComponent, SplitPaneVerticalComponent, ChatComponent, HistoryComponent, InnerSplitPaneComponent],
})
export class QuotationsPage {
  public quotationsSuggestions: any[] = [
    { icon: 'bi bi-receipt', prompt: 'Draft a quotation for the current project' },
  ];

  constructor() {}

  public activeTab: 'templates' | 'active' | 'history' = 'templates';

  setTab(tab: 'templates' | 'active' | 'history') {
    this.activeTab = tab;
  }

  // Dummy data for Templates
  public templates = [
    { id: 't1', name: 'Standard Software Quote', fileName: 'standard-software.pdf' },
    { id: 't2', name: 'Enterprise Support Quote', fileName: 'enterprise-support.pdf' },
    { id: 't3', name: 'Design Services Quote', fileName: 'design-services.pdf' },
  ];
  public selectedTemplate: { id: string; name: string; fileName: string } | null = null;

  selectTemplate(t: { id: string; name: string; fileName: string }) {
    this.selectedTemplate = t;
  }

  // Dummy data for Active Quotations
  public activeQuotes = [
    { number: 'Q-1007', client: 'Acme Corp', amount: 12500, status: 'Draft', updated: '2025-10-20' },
    { number: 'Q-1008', client: 'Globex', amount: 38900, status: 'Awaiting Approval', updated: '2025-10-21' },
    { number: 'Q-1009', client: 'Wayne Enterprises', amount: 21950, status: 'Revisions Requested', updated: '2025-10-22' },
  ];
  public selectedActiveQuote: any = null;
  selectActiveQuote(q: any) { this.selectedActiveQuote = q; }

  // Dummy data for History Quotations
  public historyQuotes = [
    { number: 'Q-0999', client: 'Stark Industries', amount: 58200, sentOn: '2025-10-10', status: 'Accepted' },
    { number: 'Q-1001', client: 'Umbrella Corp', amount: 17450, sentOn: '2025-10-12', status: 'Rejected' },
    { number: 'Q-1003', client: 'Initech', amount: 9400, sentOn: '2025-10-15', status: 'Expired' },
  ];
  public selectedHistoryQuote: any = null;
  selectHistoryQuote(q: any) { this.selectedHistoryQuote = q; }
} 