import { Model } from '@appstrax/services/database';

export enum ProjectUserRole {
  ADMIN = 'admin',
  VIEWER = 'viewer',
  CONTRIBUTOR = 'contributor',
  APPROVER = 'approver',
}

export class ProjectUser extends Model {
  projectId: string = '';
  userId: string = '';
  /** Empty (no access) until a role is set explicitly; never default to a real role. */
  role: ProjectUserRole | '' = '';
}
