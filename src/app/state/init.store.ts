import { Injectable, signal, inject } from '@angular/core';

import { UserStore, OrganizationUsersStore } from '@state';
import { OrganizationsStore, ProjectsStore } from '@state';
import { ProjectUsersStore, OrganizationProjectsStore } from '@state';

@Injectable({ providedIn: 'root' })
export class Store {
  isInitialized = signal(false);

  public userStore = inject(UserStore);
  public orgUsers = inject(OrganizationUsersStore);
  public projUsers = inject(ProjectUsersStore);
  public orgProjects = inject(OrganizationProjectsStore);
  public organizations = inject(OrganizationsStore);
  public projects = inject(ProjectsStore);

  async init(): Promise<void> {
    if (this.isInitialized()) return;
    this.isInitialized.set(false);
    try {
      await this.userStore.loadCurrent();
      const userId = this.userStore.current()?.id ?? '';
      if (!userId) throw new Error('No authenticated user');
      await this.orgUsers.loadForUser(userId);
      await this.projUsers.loadForUser(userId);

      const orgIds = Array.from(
        new Set(this.orgUsers.all().map((x) => x.organizationId))
      );
      const projectIds = Array.from(
        new Set(this.projUsers.all().map((x) => x.projectId))
      );

      await this.organizations.loadByIds(orgIds);
      await this.projects.loadByIds(projectIds);
      await this.orgProjects.loadByProjectIds(projectIds);
    } catch (e: any) {
      throw e;
    } finally {
      this.isInitialized.set(true);
    }
  }
}
