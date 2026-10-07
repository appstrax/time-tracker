import { Injectable, inject } from '@angular/core';

import { UserStore, ProjectsStore, ProjectAccessStore, RouteStore } from '@state';

@Injectable({ providedIn: 'root' })
export class Store {
  public user = inject(UserStore);
  public projects = inject(ProjectsStore);
  public route = inject(RouteStore);
  public access = inject(ProjectAccessStore);

  async init(): Promise<void> {
    try {
      await this.user.initialize();
      const user = this.user.user();
      if (user) {
        await Promise.all([
          this.projects.fetchUserProjects(user),
          this.access.refresh(user.id),
        ]);
      }
    } catch (e: any) {
      throw e;
    }
  }
}
