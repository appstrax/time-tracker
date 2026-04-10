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
  role: ProjectUserRole = ProjectUserRole.VIEWER;
}
