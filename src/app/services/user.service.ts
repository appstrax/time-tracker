import { Injectable } from '@angular/core';

import { Project } from '../models/project.model';
import { Organization } from '../models/organization.model';

import {
  OrganizationService,
  OrganizationUsersService,
  OrganizationProjectsService,
} from './organization.service';
import { ProjectService, ProjectUsersService } from './project.service';
import {
  OrganizationProjects,
  ProjectUsers,
} from '../models/many-to-many.model';
import { Operator } from '@appstrax/services';

export class UserProjectOrganizations {
  projects: Project[] = [];
  organizations: Organization[] = [];
  orgProjects: OrganizationProjects[] = [];
}

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

  public async getUserOrganizations(userId: string): Promise<Organization[]> {
    const organizations: Organization[] = [];
    const orgUsers = await this.orgUsersService.find({
      where: { userId: userId },
    });
    for (const orgUser of orgUsers.data) {
      const organization = await this.organizationService.find({
        where: { id: orgUser.organizationId },
      });
      organizations.push(organization.data[0]);
    }
    return organizations;
  }

  public async getOrgProjects(userId: string): Promise<OrganizationProjects[]> {
    const userOrganizations = await this.getUserOrganizations(userId);
    let orgProjects: OrganizationProjects[] = [];
    for (const org of userOrganizations) {
      const result = await this.orgProjectsService.find({
        where: { organizationId: org.id },
      });
      orgProjects.push(...result.data);
    }
    return orgProjects;
  }

  public async getProjectUsers(userId: string): Promise<ProjectUsers[]> {
    const projectUsers = await this.projectUsersService.find({
      where: { userId: userId },
    });
    return projectUsers.data;
  }

  public async getUserProjects(userId: string): Promise<Project[]> {
    const projects: Project[] = [];
    let projectUsers: ProjectUsers[] = [];
    projectUsers = await this.getProjectUsers(userId);
    for (const orgProjUser of projectUsers) {
      const project = await this.projectService.find({
        where: { id: orgProjUser.projectId },
      });
      projects.push(project.data[0]);
    }
    return projects;
  }

  public async getUserProjectOrganizations(
    userId: string
  ): Promise<UserProjectOrganizations> {
    const userProjectOrganizations = new UserProjectOrganizations();
    userProjectOrganizations.projects = await this.getUserProjects(userId);
    userProjectOrganizations.organizations = await this.getUserOrganizations(
      userId
    );
    userProjectOrganizations.orgProjects = await this.getOrgProjects(userId);
    return userProjectOrganizations;
  }
}
