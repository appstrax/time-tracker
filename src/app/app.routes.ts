import { Routes } from '@angular/router';

import { AuthGuard } from './utils/auth.guard';
import { AdminGuard } from './utils/admin.guard';

import { PageLayoutComponent } from '@components';

import {
  LoginPage,
  ForgotPasswordPage,
  ProjectPage,
  ProjectsPage,
  TimeSheetPage,
  HomePage,
  UsersPage,
  SettingsPage,
  ProfilePage,
  AnalyticsPage,
  LandingPage,
} from '@pages';

export const routes: Routes = [
  // PUBLIC LANDING
  { path: '', component: LandingPage, pathMatch: 'full' },

  // AUTH
  { path: 'login', component: LoginPage },
  { path: 'forgot-password', component: ForgotPasswordPage },

  {
    path: '',
    component: PageLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'home',
        data: { breadcrumb: 'Summary' },
        component: HomePage,
      },
      {
        path: 'profile',
        component: ProfilePage,
        data: { breadcrumb: 'User Profile' },
      },
      {
        path: 'projects',
        data: { breadcrumb: 'Projects' },
        canActivate: [AdminGuard],
        component: ProjectsPage,
      },
      {
        path: 'projects/project',
        data: { breadcrumb: 'Project' },
        component: ProjectPage,
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
        path: 'time-sheet',
        data: { breadcrumb: 'Time Sheets' },
        component: TimeSheetPage,
      },
      {
        path: 'analytics',
        data: { breadcrumb: 'Analytics' },
        component: AnalyticsPage,
      },
    ],
  },
  { path: '**', redirectTo: '/home' },
];
