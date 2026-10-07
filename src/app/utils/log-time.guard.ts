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
    const context = await loadAccessContext(this.store);
    if (!context) {
      this.router.navigate(['/login']);
      return false;
    }
    // A failed membership fetch fails open: pages still filter by memberships.

    if (needsAnalyticsLanding(context.memberships, context.platformAdmin)) {
      this.router.navigate(['/analytics']);
      return false;
    }
    return true;
  }
}
