import { Model } from '@appstrax/services/shared/models/model';

export type InterestIntent = 'notify' | 'presale';

export class Interest extends Model {
  public email: string = '';
  public intent: InterestIntent = 'notify';
  public note?: string;
}


