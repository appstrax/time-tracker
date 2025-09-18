import { Routes } from '@angular/router';

import { appstraxAuth } from '@appstrax/services/auth';

import { LoginPage } from './pages/auth/login/login.page';
import { SignupPage } from './pages/auth/sign-up/sign-up.page';
import { VerifyEmailPage } from './pages/auth/verify-email/verify-email.page';
import { ForgotPasswordPage } from './pages/auth/forgot-password/forgot-password.page';
import { CreateOrganizationPage } from './pages/auth/create-organization/create-organization.page';
import { CreateProjectPage } from './pages/auth/create-project/create-project.page';

import { HomePage } from './pages/home/home.page';
import { DocsPage } from './pages/docs/docs.page';
import { BasePage } from './pages/base-page/base-page.page';
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
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  
  // AUTH
  { path: 'login', component: LoginPage },
  { path: 'sign-up', component: SignupPage },
  { path: 'verify-email', component: VerifyEmailPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  { path: 'create-organization', component: CreateOrganizationPage },
  { path: 'create-project', component: CreateProjectPage },
  {
    path: '',
    component: BasePage,
    children: [
      {
        path: 'home',
        component: HomePage,
        canActivate: [() => appstraxAuth.isAuthenticated()]
      },
      { path: 'docs', component: DocsPage },
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
    ]
  },
  { path: '**', redirectTo: '/home' }
];
