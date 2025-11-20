import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Interest, InterestIntent } from '@models';
import { InterestService, ToastService } from '@services';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
})
export class LandingPage {
  email: string = '';
  intent: InterestIntent = 'notify';
  note: string = '';
  submitting: boolean = false;
  currentYear: number = new Date().getFullYear();
  selectedKey: string = 'define';
  features = [
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
    {
      key: 'workspace',
      title: 'Workspace',
      short: 'A unified space to manage delivery with clarity.',
      points: [
        'Project dashboard',
        'Activity and notifications',
        'Team collaboration'
      ],
    },
  ] as Array<{ key: string; title: string; short: string; points: string[] }>;

  constructor(private interests: InterestService, private toast: ToastService) {}

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
}


