import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SplitPaneComponent } from '../../components/split-pane/split-pane.component';

import { ToastService } from '@services';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, SplitPaneComponent],
})
export class HomePage {
  isExpanded = false;
  selectedSectionTitle: string | null = null;
  overview = { lastUpdated: '2h ago' };
  tickets = {
    open: 18,
    high: 5,
    dueToday: 3,
    recent: [
      { id: 432, title: 'Fix login redirect', status: 'Open' },
      { id: 429, title: 'Improve PDF viewer', status: 'In Review' },
      { id: 421, title: 'Dark mode polish', status: 'Done' },
    ],
  };
  repos = {
    openPRs: 4,
    build: 'Passing',
    lastCommits: [
      { repo: 'frontend', message: 'refactor: theme tokens', when: '1h ago' },
      { repo: 'api', message: 'feat: health endpoints', when: '3h ago' },
      { repo: 'docs', message: 'chore: update README', when: 'Yesterday' },
    ],
  };
  devops = {
    lastPipeline: 'Succeeded',
    deployments: [
      { env: 'Staging', result: 'Success', when: 'Today 09:32' },
      { env: 'Prod', result: 'Success', when: 'Yesterday' },
    ],
  };
  quality = { coverage: 82, failingTests: 3, lint: 14, trend: '↑ improving' };
  compliance = {
    outstanding: 7,
    failing: 1,
    deadlines: [
      { item: 'SOC2: Access Review', due: 'Fri' },
      { item: 'GDPR: DSR Export', due: 'Next week' },
    ],
  };
  docs = { recent: [
    { title: 'Architecture Overview', when: '2d ago' },
    { title: 'API Contracts', when: '3d ago' },
    { title: 'Runbook', when: '1w ago' },
  ] };
  users = {
    active: 23,
    invites: 2,
    recent: [
      { name: 'Alex Johnson', when: 'Today' },
      { name: 'Sam Green', when: 'Yesterday' },
      { name: 'Jamie Fox', when: 'Mon' },
    ],
  };
  billing = { spend: '$1,240', budget: '$3,000', nextInvoice: 'Nov 1' };
  notifications = {
    unread: 3,
    top: [
      { title: 'New deploy succeeded', when: '30m ago' },
      { title: 'You were mentioned in Ticket #432', when: '1h ago' },
      { title: 'Compliance task due Friday', when: '2h ago' },
    ],
  };
  activity = {
    today: [
      { type: 'Build', text: 'Frontend build passed', when: '09:32' },
      { type: 'Ticket', text: 'Ticket #432 updated', when: '08:15' },
      { type: 'Deploy', text: 'Staging deployment completed', when: '07:50' },
    ],
  };

  // Agent interaction counts (dummy)
  agentCounts: Record<string, { last7d: number; last30d?: number; delta?: number }> = {
    overview: { last7d: 3 },
    tickets: { last7d: 12, delta: 8 },
    repos: { last7d: 2 },
    devops: { last7d: 5 },
    quality: { last7d: 4 },
    compliance: { last7d: 6 },
    docs: { last7d: 1 },
    users: { last7d: 3 },
    billing: { last7d: 0 },
    notifications: { last7d: 7 },
    activity: { last7d: 9 },
    define: { last7d: 14 },
    design: { last7d: 6 },
    quotations: { last7d: 5 },
    settings: { last7d: 1 },
    project: { last7d: 2 },
    guardrails: { last7d: 2 },
    stats: { last7d: 1 },
    marketplace: { last7d: 0 },
  };

  constructor(private toast: ToastService) {}

  openSectionDetail(title: string) {
    this.selectedSectionTitle = title;
    this.isExpanded = true;
  }
} 