import { Routes } from '@angular/router';

import { AuthGuard } from './utils/auth.guard';

import { TimeSheetPage } from '@pages';
import { CreateProjectPage, VerifyEmailPage } from '@pages';
import { LoginPage, NotificationsPage, SignupPage } from '@pages';
import { HomePage, DocsPage, ReposPage, UsersPage } from '@pages';
import { ForgotPasswordPage, CreateOrganizationPage } from '@pages';
import { AuditPage, StatsPage, DefinePage, DevopsPage } from '@pages';
import { TicketsPage, BillingPage, QualityPage, CodePage } from '@pages';
import { SettingsPage, DesignPage, QuotationsPage, KpisPage } from '@pages';
import { BasePage, ProjectPage, ProfilePage, MarketplacePage } from '@pages';
import { TestingPage, CompliancePage, GuardrailsPage, ContactPage } from '@pages';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // AUTH
  { path: 'login', component: LoginPage },
  { path: 'sign-up', component: SignupPage },
  { path: 'verify-email', component: VerifyEmailPage },
  { path: 'create-project', component: CreateProjectPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  { path: 'create-organization', component: CreateOrganizationPage },
  {
    path: '',
    component: BasePage,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'home',
        data: { breadcrumb: 'Project Summary' },
        component: HomePage,
      },
      { path: 'audit', data: { breadcrumb: 'Audit' }, component: AuditPage },
      {
        path: 'billing',
        data: { breadcrumb: 'Project Billing' },
        component: BillingPage,
      },
      {
        path: 'quotations',
        data: { breadcrumb: 'Quotations' },
        component: QuotationsPage,
      },
      {
        path: 'testing',
        data: { breadcrumb: 'Automated Testing' },
        component: TestingPage,
      },
      {
        path: 'code',
        data: { breadcrumb: 'Code' },
        component: CodePage,
      },
      {
        path: 'compliance',
        data: { breadcrumb: 'Compliance' },
        component: CompliancePage,
      },
      {
        path: 'define',
        data: { breadcrumb: 'Project Definition' },
        component: DefinePage,
      },
      {
        path: 'design',
        data: { breadcrumb: 'Project Design' },
        component: DesignPage,
      },
      {
        path: 'devops',
        data: { breadcrumb: 'Dev-Ops' },
        component: DevopsPage,
      },
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
      {
        path: 'repos',
        data: { breadcrumb: 'Repositories' },
        component: ReposPage,
      },
      {
        path: 'stats',
        data: { breadcrumb: 'Project Statistics' },
        component: StatsPage,
      },
      {
        path: 'kpis',
        data: { breadcrumb: 'Kpis' },
        component: KpisPage,
      },
      {
        path: 'marketplace',
        data: { breadcrumb: 'Project Marketplace' },
        component: MarketplacePage,
      },
      {
        path: 'tickets',
        data: { breadcrumb: 'Tickets' },
        component: TicketsPage,
      },
      {
        path: 'users',
        data: { breadcrumb: 'User Management' },
        component: UsersPage,
      },
      {
        path: 'settings',
        data: { breadcrumb: 'Settings' },
        component: SettingsPage,
      },
      {
        path: 'contact',
        data: { breadcrumb: 'Contact' },
        component: ContactPage,
      },
      {
        path: 'notifications',
        data: { breadcrumb: 'Notifications' },
        component: NotificationsPage,
      },
      {
        path: 'time-sheet',
        data: { breadcrumb: 'Time Sheets' },
        component: TimeSheetPage,
      },
    ],
  },
  { path: '**', redirectTo: '/home' },
];
