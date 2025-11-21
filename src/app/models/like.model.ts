import { Model } from '@appstrax/services/shared/models/model';

export type LikeValue = 1 | -1;

export class Like extends Model {
  public itemKey: string = '';
  public value: LikeValue = 1;
}



