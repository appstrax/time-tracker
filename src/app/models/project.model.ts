import { Model } from '@appstrax/services/shared/models/model';

import { User } from './user.model';

export class Project extends Model {
  name: string = '';
  description: string = '';
  logoUrl: string = '';

  users: User[] = [];
}
