import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastContainerComponent } from '@components';

import { Interest, InterestIntent } from '@models';
import { InterestService, ToastService } from '@services';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastContainerComponent],
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
})
export class LandingPage implements OnInit {
  email: string = '';
  intent: InterestIntent = 'notify';
  note: string = '';
  submitting: boolean = false;
  currentYear: number = new Date().getFullYear();
  interestCount: number | null = null;
  selectedKey: string = 'summary';
  features = [
    {
      key: 'summary',
      title: 'Summary',
      short: 'A high-level overview of your project’s current state and what needs attention.',
      points: [
        'Key metrics and recent activity',
        'Top issues and next steps',
        'Single source of truth to align the team'
      ],
    },
    {
      key: 'define',
      title: 'Define',
      short: 'Capture requirements and constraints with structure to reduce churn.',
      points: [
        'Guided prompts and templates',
        'Traceable requirements and scope',
        'Auto‑linked to design and tests'
      ],
    },
    {
      key: 'design',
      title: 'Design',
      short: 'Generate architecture, data models, and interfaces consistently.',
      points: [
        'Opinionated, scalable architecture',
        'Schema and API contracts',
        'Designs aligned to guardrails'
      ],
    },
    {
      key: 'db-design',
      title: 'DB Design',
      short: 'Model data with validation and migrations from day one.',
      points: [
        'Entity modeling with relations',
        'Migration planning',
        'Performance‑minded defaults'
      ],
    },
    {
      key: 'guardrails',
      title: 'Guardrails',
      short: 'Built‑in checks enforce standards and prevent regressions.',
      points: [
        'Security and quality policies',
        'Best practices baked in',
        'Continuous validation'
      ],
    },
    {
      key: 'testing',
      title: 'Testing',
      short: 'Automated harnesses validate behavior before code ships.',
      points: [
        'Contract and integration tests',
        'Coverage guidance',
        'Fast feedback loops'
      ],
    },
    {
      key: 'devops',
      title: 'Dev‑Ops',
      short: 'Pipelines and environments set up for reliable delivery.',
      points: [
        'CI/CD out of the box',
        'Environment configs',
        'Observability ready'
      ],
    },
    {
      key: 'docs',
      title: 'Docs',
      short: 'Living documentation stays in sync with the product.',
      points: [
        'Generated artifacts',
        'Human‑readable overviews',
        'Always up to date'
      ],
    },
  ] as Array<{ key: string; title: string; short: string; points: string[] }>;

  constructor(private interests: InterestService, private toast: ToastService) {}

  async ngOnInit(): Promise<void> {
    await this.loadInterestCount();
  }

  private async loadInterestCount(): Promise<void> {
    try {
      const res: any = await this.interests.find();
      const dataLen = Array.isArray(res?.data) ? res.data.length : 0;
      this.interestCount = (res?.total ?? res?.count ?? dataLen) ?? dataLen;
    } catch {
      this.interestCount = null;
    }
  }

  async submitInterest(): Promise<void> {
    if (!this.email || !this.isValidEmail(this.email)) {
      this.toast.error('Please enter a valid email address.');
      return;
    }
    this.submitting = true;
    try {
      const record = new Interest();
      record.email = this.email.trim();
      record.intent = this.intent;
      record.note = this.note?.trim() || undefined;
      await this.interests.save(record);
      this.toast.success('Thanks! We will notify you.');
      this.email = '';
      this.note = '';
      this.intent = 'notify';
      // Refresh interest count after successful submission
      this.loadInterestCount();
    } catch (e: any) {
      this.toast.error('Oops, something went wrong. Please try again later.');
      console.error('Interest submit error', e);
    } finally {
      this.submitting = false;
    }
  }

  private isValidEmail(val: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  selectFeature(key: string): void {
    this.selectedKey = key;
  }

  get selectedFeature() {
    return this.features.find((f) => f.key === this.selectedKey);
  }

  featureImages: Record<string, string> = {
    summary: '/site-previews/summary.png',
    // define: '/site-previews/define.png',
    // design: '/site-previews/design.png',
    // db-design: '/site-previews/db-design.png',
    // guardrails: '/site-previews/guardrails.png',
    // testing: '/site-previews/testing.png',
    // devops: '/site-previews/devops.png',
    // docs: '/site-previews/docs.png',
    // workspace: '/site-previews/workspace.png',
  };

  get selectedImage(): string | null {
    return this.featureImages[this.selectedKey] ?? null;
  }

  // Extra features (AI tools & extras)
  extraSelectedKey: string = 'quoting';
  extraFeatures = [
    {
      key: 'quoting',
      title: 'Quoting Automation',
      short: 'Generate accurate quotations from definitions and scope in minutes.',
      points: [
        'AI-assisted scope parsing',
        'Cost templates and adjustments',
        'Exportable PDFs for clients'
      ],
    },
    {
      key: 'time-tracking',
      title: 'Time Tracking',
      short: 'Lightweight time sheets aligned to tasks and scope for better insights.',
      points: [
        'Track by task, scope, or feature',
        'Automated summaries',
        'Export for billing'
      ],
    },
    {
      key: 'workspace',
      title: 'Workspace Management',
      short: 'Organize projects, teams, and permissions in one place.',
      points: [
        'Projects and organizations',
        'Roles and access control',
        'Activity and notifications'
      ],
    },
    {
      key: 'billing',
      title: 'Billing',
      short: 'Simplify invoicing and track spend against budgets.',
      points: [
        'Issue invoices and credit notes',
        'Budget tracking',
        'Multiple payment options'
      ],
    },
    {
      key: 'user-management',
      title: 'User Management',
      short: 'Invite, manage roles, and keep teams aligned.',
      points: [
        'Invitations and roles',
        'Directory and profiles',
        'Org- or project-level control'
      ],
    },
    {
      key: 'marketplace',
      title: 'Marketplace',
      short: 'Extend The Machine with add-ons, integrations, and expert services.',
      points: [
        'Discover integrations',
        'Install add-ons',
        'Engage verified partners'
      ],
    },
  ] as Array<{ key: string; title: string; short: string; points: string[] }>;

  extraFeatureImages: Record<string, string> = {
    quoting: '/site-previews/quoting.png',
    // 'time-tracking': '/site-previews/time-tracking.png',
    // workspace: '/site-previews/workspace.png',
    // billing: '/site-previews/billing.png',
    // 'user-management': '/site-previews/user-management.png',
    // marketplace: '/site-previews/marketplace.png',
  };

  selectExtraFeature(key: string): void {
    this.extraSelectedKey = key;
  }

  get extraSelectedFeature() {
    return this.extraFeatures.find((f) => f.key === this.extraSelectedKey);
  }

  get extraSelectedImage(): string | null {
    return this.extraFeatureImages[this.extraSelectedKey] ?? null;
  }
}


