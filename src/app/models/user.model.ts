import { User as AuthUser } from '@appstrax/services/auth';
import { Model } from '@appstrax/services/shared/models/model';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export class User extends Model {
  static fromAuthUser(authUser: AuthUser): User {
    const user = new User();
    user.id = authUser.id;
    user.createdAt = new Date(authUser.createdAt);
    user.updatedAt = new Date(authUser.updatedAt);
    user.email = authUser.email;
    user.name = authUser.data?.name ?? '';
    user.surname = authUser.data?.surname ?? '';
    user.profilePictureUrl = authUser.data?.profilePictureUrl ?? '';
    user.role = authUser.roles[0] as UserRole ?? UserRole.USER;

    return user;
  }

  public email: string = '';

  // DATA FIELDS
  public name: string = '';
  public surname: string = '';
  public profilePictureUrl: string = '';
  public role: UserRole = UserRole.USER;
}
