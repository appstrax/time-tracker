import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { appstraxAuth } from '@appstrax/services/auth';

import { UserRole } from '@models';

@Injectable({ providedIn: 'root' })
export class AdminGuard {
  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    try {
      const authUser = await appstraxAuth.getUser();
      if (authUser.roles.includes(UserRole.ADMIN)) return true;
    } catch {
      // Fall through to redirect when auth user cannot be resolved.
    }

    this.router.navigate(['/home']);
    return false;
  }
}
