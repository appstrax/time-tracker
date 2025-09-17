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

export class OrganizationUsers {
  organizationId: string = '';
  userId: string = '';
  role: OrgUserRoles = OrgUserRoles.USER;
}

export class ProjectUsers {
  projectId: string = '';
  userId: string = '';
  role: ProjectUserRoles = ProjectUserRoles.SOLUTIONS_ARCHITECT;
}

export class ProjectOrganizations {
  projectId: string = '';
  organizationId: string = '';
  role: ProjectOrgRoles = ProjectOrgRoles.CLIENT;
}
