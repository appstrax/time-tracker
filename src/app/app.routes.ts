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
        component: HomePage,
      },
      {
        path: 'profile',
        component: ProfilePage,
      },
      {
        path: 'projects',
        canActivate: [AdminGuard],
        component: ProjectsPage,
      },
      {
        path: 'projects/project',
        canActivate: [AdminGuard],
        component: ProjectPage,
      },
      {
        path: 'settings',
        component: SettingsPage,
      },
      {
        path: 'time-sheet',
        component: TimeSheetPage,
      },
      {
        path: 'analytics',
        component: AnalyticsPage,
      },
    ],
  },
  { path: '**', redirectTo: '/home' },
];
