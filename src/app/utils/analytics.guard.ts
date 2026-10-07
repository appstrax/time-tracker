import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

import { ToastService } from '@services';
import { Store } from '@state';

import { loadAccessContext } from './access-context.util';
import {
  hasAnalyticsAccess,
  needsAnalyticsLanding,
  resolveProjectPermissions,
  roleOf,
} from './project-access.util';

@Injectable({ providedIn: 'root' })
export class AnalyticsGuard {
  constructor(
    private store: Store,
    private router: Router,
    private toast: ToastService,
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const context = await loadAccessContext(this.store);
    if (!context) {
      this.router.navigate(['/login']);
      return false;
    }
    const { memberships, platformAdmin } = context;
    if (platformAdmin) return true;

    const projectId = route.paramMap.get('projectId');
    const allowed = projectId
      ? resolveProjectPermissions(roleOf(memberships, projectId), false).viewAnalytics
      : hasAnalyticsAccess(memberships, false);
    if (allowed) return true;

    if (projectId) this.toast.error('You do not have access to that project');
    this.router.navigate([
      needsAnalyticsLanding(memberships, false) ? '/analytics' : '/home',
    ]);
    return false;
  }
}
