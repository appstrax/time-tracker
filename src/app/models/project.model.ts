import { Model } from '@appstrax/services/shared/models/model';

import { User } from './user.model';
import { ProjectField } from './time-sheet-field.model';

export class Project extends Model {
  name: string = '';
  description: string = '';
  logoUrl: string = '';

  users: User[] = [];
  fields: ProjectField[] = [];
  categories: string[] = [];
  allowCustomCategory: boolean = true;
}
