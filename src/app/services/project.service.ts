import { Injectable } from '@angular/core';
import { CrudService } from '@appstrax/services/database';

import { ProjectUsers } from '../models/many-to-many.model';
import { Project } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService extends CrudService<Project> {
  constructor() {
    super('projects', Project);
  }
}

@Injectable({ providedIn: 'root' })
export class ProjectUsersService extends CrudService<ProjectUsers> {
  constructor() {
    super('project-users', ProjectUsers);
  }
}
