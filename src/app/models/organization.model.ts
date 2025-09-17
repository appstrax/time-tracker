import { BaseModel } from "./base-model";

export class Organization extends BaseModel {
  name: string = '';
  address: string = '';
  city: string = '';
  state: string = '';
  zip: string = '';
  country: string = '';
  phone: string = '';
  email: string = '';
  website: string = '';
  logoUrl: string = '';
}