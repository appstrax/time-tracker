import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { HomePage } from './pages/home/home.page';
import { appstraxAuth } from '@appstrax/services/auth';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    component: LoginPage,
  },
  { 
    path: 'home', 
    component: HomePage,
    canActivate: [() => appstraxAuth.isAuthenticated()]
  },
];
