import { Injectable } from '@angular/core';
import { CrudService } from '@appstrax/services/database';
import { appstraxAuth, Operator } from '@appstrax/services/auth';

import { UserRole } from '@models';
import { ProjectUser } from '../models/project-user.model';
import { Project } from '../models/project.model';
import { UsersService } from './user.service';

@Injectable({ providedIn: 'root' })
export class ProjectUserService extends CrudService<ProjectUser> {
  constructor() {
    super('project-users', ProjectUser);
  }

  async findByProjectId(projectId: string): Promise<ProjectUser[]> {
    const res = await this.find({ where: { projectId } });
    return res.data ?? [];
  }

  async findByUserId(userId: string): Promise<ProjectUser[]> {
    const res = await this.find({ where: { userId } });
    return res.data ?? [];
  }

  async findByProjectIds(projectIds: string[]): Promise<ProjectUser[]> {
    const res = await this.find({
      where: { projectId: { [Operator.IN]: projectIds } },
    });
    return res.data ?? [];
  }
}

@Injectable({ providedIn: 'root' })
export class ProjectService extends CrudService<Project> {
  constructor(
    private projectUserService: ProjectUserService,
    private usersService: UsersService,
  ) {
    super('projects', Project);
  }

  async findByUserId(userId: string): Promise<Project[]> {
    const userProjects = await this.projectUserService.findByUserId(userId);

    const projectIds = userProjects.map((x) => x.projectId);
    const projects = await this.findByIds(projectIds);

    return this.populateProjectUsers(projects);
  }

  async findAll(): Promise<Project[]> {
    const res = await this.find({});
    return this.populateProjectUsers(res.data ?? []);
  }

  async findByIds(ids: string[]): Promise<Project[]> {
    const res = await this.find({ where: { id: { [Operator.IN]: ids } } });
    return res.data ?? [];
  }

  private async populateProjectUsers(projects: Project[]): Promise<Project[]> {
    if (!projects.length) return [];

    const authUser = await appstraxAuth.getUser();
    if (!authUser?.roles?.includes(UserRole.ADMIN)) {
      for (const project of projects) {
        project.users = [];
      }
      return projects;
    }

    const projectIds = projects.map((x) => x.id);
    const projectUsers =
      await this.projectUserService.findByProjectIds(projectIds);

    if (!projectUsers.length) {
      for (const project of projects) {
        project.users = [];
      }
      return projects;
    }

    const userIds = [...new Set(projectUsers.map((x) => x.userId))];
    const users = await this.usersService.findByUserIds(userIds);

    for (const project of projects) {
      const projectUserIds = projectUsers
        .filter((x) => x.projectId === project.id)
        .map((x) => x.userId);

      project.users = users.filter((x) => projectUserIds.includes(x.id));
    }

    return projects;
  }
}
