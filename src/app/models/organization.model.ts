import { Model } from '@appstrax/services/shared/models/model';

export class Organization extends Model {
  name: string = '';
  description: string = '';
  address: string = '';
  email: string = '';
  country: string = '';
  city: string = '';
  state: string = '';
  zip: string = '';
  phone: string = '';
  website: string = '';
  logoUrl: string = '';
}