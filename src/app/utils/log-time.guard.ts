import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@state';

import { loadAccessContext } from './access-context.util';
import { needsAnalyticsLanding } from './project-access.util';

@Injectable({ providedIn: 'root' })
export class LogTimeGuard {
  constructor(
    private store: Store,
    private router: Router,
  ) {}

  async canActivate(): Promise<boolean> {
    let context;
    try {
      context = await loadAccessContext(this.store);
    } catch {
      // Same target as AuthGuard when the user cannot be resolved.
      this.router.navigate(['']);
      return false;
    }

    if (needsAnalyticsLanding(context.memberships, context.platformAdmin)) {
      this.router.navigate(['/analytics']);
      return false;
    }
    return true;
  }
}
