import { Injectable } from '@angular/core';

import {
  OrganizationService,
  OrganizationUsersService,
  OrganizationProjectsService,
} from './organization.service';
import { ProjectService, ProjectUsersService } from './project.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(
    private projectService: ProjectService,
    private projectUsersService: ProjectUsersService,
    private organizationService: OrganizationService,
    private orgUsersService: OrganizationUsersService,
    private orgProjectsService: OrganizationProjectsService
  ) {}

  public async hasOrganization(userId: string): Promise<boolean> {
    const orgUsers = await this.orgUsersService.find({
      where: { userId: userId },
    });
    return orgUsers.data.length > 0;
  }

  public async hasProject(userId: string): Promise<boolean> {
    const orgProjects = await this.projectUsersService.find({
      where: { userId: userId },
    });
    return orgProjects.data.length > 0;
  }
}
