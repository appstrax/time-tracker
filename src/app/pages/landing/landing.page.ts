import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastContainerComponent } from '@components';

import { Interest, InterestIntent, Like } from '@models';
import { InterestService, ToastService, LikeService } from '@services';

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
      short: 'Generate architecture, data models, and interfaces with human review built in.',
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
      short: 'Built‑in checks and human review gates enforce standards and prevent regressions.',
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
      short: 'Pipelines and environments set up for reliable delivery at scale.',
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

  constructor(private interests: InterestService, private toast: ToastService, private likes: LikeService) {}

  async ngOnInit(): Promise<void> {
    await this.loadInterestCount();
    await this.loadAllTallies();
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
    // Check for existing submission by email
    try {
      const emailToCheck = this.email.trim();
      const existing: any = await this.interests.find({ where: { email: emailToCheck } as any });
      const existingCount =
        Array.isArray(existing?.data) ? existing.data.length : ((existing?.total ?? existing?.count) ?? 0);
      if (existingCount > 0) {
        this.toast.info('You’ve already submitted interest with this email.');
        return;
      }
    } catch {
      // If the check fails, proceed with submission to avoid blocking interested users.
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

  // Voting (generic across sections)
  tallies: Record<string, number> = {};
  labels: Record<string, string> = {};
  summary: Array<{ key: string; label: string; count: number }> = [];
  private audienceKeys: string[] = [];
  private benefitKeys: string[] = [];
  private truthKeys: string[] = [];
  private featureKeys: string[] = [];
  private extraKeys: string[] = [];

  private voteStorageKey(itemKey: string): string {
    return `vote:${itemKey}`;
  }

  getPreviousVote(itemKey: string): 1 | -1 | null {
    const raw = localStorage.getItem(this.voteStorageKey(itemKey));
    if (raw === '1') return 1;
    if (raw === '-1') return -1;
    return null;
  }

  private setVoted(itemKey: string, value: 1 | -1): void {
    localStorage.setItem(this.voteStorageKey(itemKey), String(value));
  }

  private pendingVotes = new Set<string>();
  isVoting(itemKey: string): boolean {
    return this.pendingVotes.has(itemKey);
  }

  private getAllVoteKeys(): string[] {
    const audience = [
      'audience-developers',
      'audience-founders',
      'audience-newcomers',
      'audience-teams',
      'audience-agencies',
      'audience-anyone',
      'audience-freelancers',
      'audience-enterprises',
    ];
    const benefits = ['benefit-ship-fast', 'benefit-reduce-rework', 'benefit-scale', 'benefit-predictable'];
    const truths = ['truths-ai-multiplies', 'truths-avoid-vibe', 'truths-heroes', 'truths-scale'];
    const features = (this.features ?? []).map((f) => `feature-${f.key}`);
    const extras = (this.extraFeatures ?? []).map((f) => `extra-${f.key}`);
    this.audienceKeys = audience;
    this.benefitKeys = benefits;
    this.truthKeys = truths;
    this.featureKeys = features;
    this.extraKeys = extras;
    return [...audience, ...benefits, ...truths, ...features, ...extras];
  }

  private buildLabels(): void {
    this.labels = {
      // audience
      'audience-developers': 'Developers',
      'audience-founders': 'Founders & Clients',
      'audience-newcomers': 'Newcomers',
      'audience-teams': 'Teams & PMs',
      'audience-agencies': 'Agencies',
      'audience-anyone': 'Anyone with an idea',
      'audience-freelancers': 'Freelancers',
      'audience-enterprises': 'Enterprises',
      // benefits
      'benefit-ship-fast': 'Ship 100× faster',
      'benefit-reduce-rework': 'Reduce rework 30–70%',
      'benefit-scale': 'Scale without the rebuild tax',
      'benefit-predictable': 'Predictable delivery',
      // truths
      'truths-ai-multiplies': 'AI multiplies experienced teams',
      'truths-avoid-vibe': 'Avoid the “vibe coding” wall',
      'truths-heroes': 'Heroes on your team',
      'truths-scale': 'Scale with the power of AI',
    };
    for (const f of this.features ?? []) this.labels[`feature-${f.key}`] = f.title;
    for (const xf of this.extraFeatures ?? []) this.labels[`extra-${xf.key}`] = xf.title;
  }

  private updateSummary(): void {
    const entries = Object.entries(this.tallies).map(([key, count]) => ({
      key,
      count: count ?? 0,
      label: this.labels[key] ?? key,
    }));
    this.summary = entries.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  }

  async loadAllTallies(): Promise<void> {
    try {
      this.buildLabels();
      const keys = this.getAllVoteKeys();
      // initialize zeros
      for (const k of keys) this.tallies[k] = this.tallies[k] ?? 0;
      const tallies = await this.likes.getTallies(keys);
      this.tallies = { ...this.tallies, ...tallies };
      this.updateSummary();
    } catch {
      // ignore
    }
  }

  async vote(itemKey: string, value: 1 | -1): Promise<void> {
    if (this.isVoting(itemKey)) return;
    const prev = this.getPreviousVote(itemKey);
    if (prev === value) {
      this.toast.info('You already selected this.');
      return;
    }
    this.pendingVotes.add(itemKey);
    try {
      if (prev === null) {
        const rec = new Like();
        rec.itemKey = itemKey;
        rec.value = value;
        await this.likes.save(rec);
        this.tallies[itemKey] = (this.tallies[itemKey] ?? 0) + value;
        this.setVoted(itemKey, value);
      } else {
        const delta = (value - prev) as 2 | -2;
        const step: 1 | -1 = (delta > 0 ? 1 : -1);
        // Apply |delta| times to reflect change from prev to new
        for (let i = 0; i < Math.abs(delta); i++) {
          const rec = new Like();
          rec.itemKey = itemKey;
          rec.value = step;
          await this.likes.save(rec);
        }
        this.tallies[itemKey] = (this.tallies[itemKey] ?? 0) + delta;
        this.setVoted(itemKey, value);
      }
      this.updateSummary();
    } catch {
      this.toast.error('Could not record your vote. Please try again later.');
    } finally {
      this.pendingVotes.delete(itemKey);
    }
  }

  getTally(key: string): number {
    return this.tallies[key] ?? 0;
  }

  private mapKeys(keys: string[]) {
    return (keys ?? []).map((k) => ({
      key: k,
      label: this.labels[k] ?? k,
      count: this.getTally(k),
    }));
  }

  getAudienceSummary() {
    return this.mapKeys(this.audienceKeys);
  }
  getBenefitSummary() {
    return this.mapKeys(this.benefitKeys);
  }
  getTruthsSummary() {
    return this.mapKeys(this.truthKeys);
  }
  getFeatureSummary() {
    return this.mapKeys(this.featureKeys);
  }
  getExtraSummary() {
    return this.mapKeys(this.extraKeys);
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


