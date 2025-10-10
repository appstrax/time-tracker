import { Routes } from '@angular/router';

import { appstraxAuth } from '@appstrax/services/auth';

import { LoginPage, SignupPage } from '@pages';
import { CreateProjectPage, VerifyEmailPage } from '@pages';
import { ForgotPasswordPage, CreateOrganizationPage } from '@pages';

import { CompliancePage, GuardrailsPage } from '@pages';
import { BasePage, ProjectPage, ProfilePage } from '@pages';
import { TicketsPage, BillingPage, QualityPage } from '@pages';
import { HomePage, DocsPage, ReposPage, UsersPage } from '@pages';
import { AuditPage, StatsPage, DefinePage, DevopsPage } from '@pages';
import { SettingsPage } from '@pages';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

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
        canActivate: [() => appstraxAuth.isAuthenticated()],
      },
      { path: 'audit', component: AuditPage },
      { path: 'billing', component: BillingPage },
      { path: 'compliance', component: CompliancePage },
      { path: 'define', component: DefinePage },
      { path: 'devops', component: DevopsPage },
      { path: 'docs', component: DocsPage },
      { path: 'docs', component: DocsPage },
      { path: 'guardrails', component: GuardrailsPage },
      { path: 'profile', component: ProfilePage },
      { path: 'project', component: ProjectPage },
      { path: 'quality', component: QualityPage },
      { path: 'repos', component: ReposPage },
      { path: 'stats', component: StatsPage },
      { path: 'tickets', component: TicketsPage },
      { path: 'users', component: UsersPage },
      { path: 'settings', component: SettingsPage },
    ],
  },
  { path: '**', redirectTo: '/home' },
];
