import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';

import { ToastService } from '@services';
import { Store } from '@state';

import { loadAccessContext } from './access-context.util';
import { needsAnalyticsLanding } from './project-access.util';

@Injectable({ providedIn: 'root' })
export class LogTimeGuard {
  constructor(
    private store: Store,
    private router: Router,
    private toast: ToastService,
  ) {}

  async canActivate(): Promise<boolean | UrlTree> {
    const context = await loadAccessContext(this.store, this.toast);
    if (!context) return this.router.createUrlTree(['/login']);
    // A failed membership fetch fails open: pages still filter by memberships.

    if (needsAnalyticsLanding(context.memberships, context.platformAdmin)) {
      return this.router.createUrlTree(['/analytics']);
    }
    return true;
  }
}
