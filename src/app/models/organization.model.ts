import { BaseModel } from "./base-model";

export class Organization extends BaseModel {
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