import { Routes } from '@angular/router';

import { appstraxAuth } from '@appstrax/services/auth';

import { HomePage } from './pages/home/home.page';
import { DocsPage } from './pages/docs/docs.page';
import { LoginPage } from './pages/login/login.page';
import { ReposPage } from './pages/repos/repos.page';
import { UsersPage } from './pages/users/users.page';
import { AuditPage } from './pages/audit/audit.page';
import { StatsPage } from './pages/stats/stats.page';
import { DefinePage } from './pages/define/define.page';
import { DevopsPage } from './pages/devops/devops.page';
import { TicketsPage } from './pages/tickets/tickets.page';
import { BillingPage } from './pages/billing/billing.page';
import { QualityPage } from './pages/quality/quality.page';
import { ProjectPage } from './pages/project/project.page';
import { ProfilePage } from './pages/profile/profile.page';
import { GuardrailsPage } from './pages/guardrails/guardrails.page';
import { CompliancePage } from './pages/compliance/compliance.page';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'define', component: DefinePage },
  { path: 'tickets', component: TicketsPage },
  { path: 'repos', component: ReposPage },
  { path: 'billing', component: BillingPage },
  { path: 'users', component: UsersPage },
  { path: 'docs', component: DocsPage },
  { path: 'compliance', component: CompliancePage },
  { path: 'devops', component: DevopsPage },
  { path: 'guardrails', component: GuardrailsPage },
  { path: 'quality', component: QualityPage },
  { path: 'audit', component: AuditPage },
  { path: 'project', component: ProjectPage },
  { path: 'stats', component: StatsPage },
  { path: 'profile', component: ProfilePage },
  { path: 'login', component: LoginPage },
  { 
    path: 'home', 
    component: HomePage,
    canActivate: [() => appstraxAuth.isAuthenticated()]
  },
  { path: '**', redirectTo: '/home' }
];
