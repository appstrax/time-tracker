import { Injectable } from '@angular/core';
import { CrudService } from '@appstrax/services/database';

import { Organization } from '../models/organization.model';
import { OrganizationUsers } from '../models/many-to-many.model';

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
