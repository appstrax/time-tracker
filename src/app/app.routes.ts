import { Routes } from '@angular/router';

import { appstraxAuth } from '@appstrax/services/auth';

import { LoginPage, SignupPage } from '@pages';
import { CreateProjectPage, VerifyEmailPage } from '@pages';
import { ForgotPasswordPage, CreateOrganizationPage } from '@pages';

import { SettingsPage } from '@pages';
import { CompliancePage, GuardrailsPage } from '@pages';
import { BasePage, ProjectPage, ProfilePage } from '@pages';
import { TicketsPage, BillingPage, QualityPage } from '@pages';
import { HomePage, DocsPage, ReposPage, UsersPage } from '@pages';
import { AuditPage, StatsPage, DefinePage, DevopsPage } from '@pages';

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
        data: { breadcrumb: 'Welcome' },
        component: HomePage,
        canActivate: [() => appstraxAuth.isAuthenticated()],
      },
      { path: 'audit', data: { breadcrumb: 'Audit' }, component: AuditPage },
      {
        path: 'billing',
        data: { breadcrumb: 'Billing' },
        component: BillingPage,
      },
      {
        path: 'compliance',
        data: { breadcrumb: 'Compliance' },
        component: CompliancePage,
      },
      { path: 'define', data: { breadcrumb: 'Project Definition' }, component: DefinePage },
      { path: 'devops', data: { breadcrumb: 'Dev-Ops' }, component: DevopsPage },
      { path: 'docs', data: { breadcrumb: 'Documents' }, component: DocsPage },
      {
        path: 'guardrails',
        data: { breadcrumb: 'Guard Rails' },
        component: GuardrailsPage,
      },
      {
        path: 'profile',
        component: ProfilePage,
        data: { breadcrumb: 'User Profile' },
      },
      {
        path: 'project',
        data: { breadcrumb: 'Project' },
        component: ProjectPage,
      },
      {
        path: 'quality',
        data: { breadcrumb: 'Quality' },
        component: QualityPage,
      },
      { path: 'repos', data: { breadcrumb: 'Repositories' }, component: ReposPage },
      { path: 'stats', data: { breadcrumb: 'Project Statistics' }, component: StatsPage },
      {
        path: 'tickets',
        data: { breadcrumb: 'Tickets' },
        component: TicketsPage,
      },
      { path: 'users', data: { breadcrumb: 'User Management' }, component: UsersPage },
      {
        path: 'settings',
        data: { breadcrumb: 'Settings' },
        component: SettingsPage,
      },
    ],
  },
  { path: '**', redirectTo: '/home' },
];
