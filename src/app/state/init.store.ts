import { Injectable, signal, inject } from '@angular/core';

import { UserStore, OrganizationUsersStore } from '@state';
import { OrganizationsStore, ProjectsStore } from '@state';
import { ProjectUsersStore, OrganizationProjectsStore } from '@state';

@Injectable({ providedIn: 'root' })
export class Store {
  selectedProjectId = signal<string | null>(null);
  selectedOrganizationId = signal<string | null>(null);

  public userStore = inject(UserStore);
  public orgUsers = inject(OrganizationUsersStore);
  public projUsers = inject(ProjectUsersStore);
  public orgProjects = inject(OrganizationProjectsStore);
  public organizations = inject(OrganizationsStore);
  public projects = inject(ProjectsStore);

  async init(): Promise<void> {
    try {
      await this.userStore.loadCurrent();
      await this.delay(100)
      const userId = this.userStore.current()?.id ?? '';
      if (!userId) throw new Error('No authenticated user');
      await this.orgUsers.loadForUser(userId);
      await this.delay(100)
      await this.projUsers.loadForUser(userId);
      await this.delay(100)

      const orgIds = Array.from(
        new Set(this.orgUsers.all().map((x) => x.organizationId))
      );
      const projectIds = Array.from(
        new Set(this.projUsers.all().map((x) => x.projectId))
      );
      await this.delay(100)
      await this.organizations.loadByIds(orgIds);
      await this.delay(100)
      await this.projects.loadByIds(projectIds);
      await this.delay(100)
      await this.orgProjects.loadByProjectIds(projectIds);
      await this.delay(100)
    } catch (e: any) {
      throw e;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
