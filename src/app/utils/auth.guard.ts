import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isAuthenticatedAfterReady } from './auth-ready.util';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    const isAuthenticated = await isAuthenticatedAfterReady();
    if (!isAuthenticated) {
      this.router.navigate(['']);
      return false;
    }
    return true;
  }
}
