import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SplitPaneComponent } from '../../components/split-pane/split-pane.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.page.html',
  styleUrls: ['./contact.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SplitPaneComponent],
})
export class ContactPage {
  public activeTab: 'details' | 'faq' | 'status' | 'releases' | 'upcoming' = 'details';

  public topics: string[] = [
    'General support',
    'Sales',
    'Billing',
    'Technical issue',
    'Feature request',
    'Training',
    'Documentation',
  ];

  public form = {
    topic: '',
    name: '',
    email: '',
    organization: '',
    subject: '',
    message: '',
    consent: false,
  };

  public isSubmitting = false;
  public submitSuccess = false;

  public upcomingFeatures: Array<{
    id: string;
    title: string;
    description: string;
    expectedDate: string; // ISO or friendly date
    status: 'Planned' | 'In Progress' | 'Beta' | 'Done' | 'Paused';
  }> = [
    {
      id: 'uf1',
      title: 'Quotation email templates',
      description: 'Built-in email templates for sending quotations with branding support.',
      expectedDate: '2025-11-15',
      status: 'Planned',
    },
    {
      id: 'uf2',
      title: 'Kanban swimlanes',
      description: 'Group cards by priority or assignee to improve visibility.',
      expectedDate: '2025-12-01',
      status: 'In Progress',
    },
    {
      id: 'uf3',
      title: 'Advanced user roles',
      description: 'Finer-grained permissions and role-based access controls.',
      expectedDate: '2026-01-10',
      status: 'Planned',
    },
  ];

  setTab(tab: 'details' | 'faq' | 'status' | 'releases' | 'upcoming') {
    this.activeTab = tab;
  }

  onEditFeature(feature: any) {
    console.log('Edit feature', feature);
  }

  onMarkDone(feature: any) {
    console.log('Mark done', feature);
  }

  onArchiveFeature(feature: any) {
    console.log('Archive feature', feature);
  }

  async onSubmit() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.submitSuccess = false;
    try {
      // Simulate request
      await new Promise((res) => setTimeout(res, 800));
      this.submitSuccess = true;
    } finally {
      this.isSubmitting = false;
    }
  }
} 