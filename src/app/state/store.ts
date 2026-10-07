import { Injectable, inject } from '@angular/core';

import { UserStore, ProjectsStore, ProjectAccessStore, RouteStore } from '@state';

@Injectable({ providedIn: 'root' })
export class Store {
  public user = inject(UserStore);
  public projects = inject(ProjectsStore);
  public route = inject(RouteStore);
  public access = inject(ProjectAccessStore);

  async init(): Promise<void> {
    await this.user.initialize();
    const user = this.user.user();
    if (user) {
      await Promise.all([
        this.projects.fetchUserProjects(user),
        // Non-fatal: the guards refetch memberships on every navigation.
        this.access.refresh(user.id).catch((error) => {
          console.error('Failed to refresh project memberships', error);
        }),
      ]);
    }
  }
}
