import { Model } from "@appstrax/services/database";

export enum OrgUserRoles {
  USER = 'user',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

export enum ProjectUserRoles {
  ADMIN = 'admin',
  OWNER = 'owner',
  VIEWER = 'viewer',
  MEMBER = 'member',
  REVIEWER = 'reviewer',
  SOLUTIONS_ARCHITECT = 'solutions_architect',
}

export enum ProjectOrgRoles {
  CLIENT = 'client',
  PROVIDER = 'provider',
}

export class OrganizationUsers extends Model {
  organizationId: string = '';
  userId: string = '';
  role: OrgUserRoles = OrgUserRoles.ADMIN;
}

export class ProjectUsers extends Model {
  projectId: string = '';
  userId: string = '';
  role: ProjectUserRoles = ProjectUserRoles.ADMIN;
}

export class ProjectOrganizations extends Model {
  projectId: string = '';
  organizationId: string = '';
  role: ProjectOrgRoles = ProjectOrgRoles.PROVIDER;
}
