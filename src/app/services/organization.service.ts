import { Injectable } from '@angular/core';
import { CrudService } from '@appstrax/services/database';

import { Organization, OrganizationUsers, OrganizationProjects } from '@models';

@Injectable({ providedIn: 'root' })
export class OrganizationService extends CrudService<Organization> {
  constructor() {
    super('organizations', Organization);
  }
}

@Injectable({ providedIn: 'root' })
export class OrganizationUsersService extends CrudService<OrganizationUsers> {
  constructor() {
    super('organization-users', OrganizationUsers);
  }
}

@Injectable({ providedIn: 'root' })
export class OrganizationProjectsService extends CrudService<OrganizationProjects> {
  constructor() {
    super('organization-projects', OrganizationProjects);
  }
}
