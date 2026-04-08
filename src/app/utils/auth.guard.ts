import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { appstraxAuth } from '@appstrax/services/auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    const isAuthenticated = await appstraxAuth.isAuthenticated();
    if (!isAuthenticated) {
      this.router.navigate(['']);
      return false;
    }
    return true;
  }
}
