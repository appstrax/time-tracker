import { Injectable, inject } from '@angular/core';

import { UserStore, ProjectsStore, RouteStore } from '@state';

@Injectable({ providedIn: 'root' })
export class Store {
  public user = inject(UserStore);
  public projects = inject(ProjectsStore);
  public route = inject(RouteStore);

  async init(): Promise<void> {
    try {
      await this.user.initialize();
      if (this.user.user()) {
        await this.projects.fetchUserProjects(this.user.user()!);
      }
    } catch (e: any) {
      throw e;
    }
  }
}
