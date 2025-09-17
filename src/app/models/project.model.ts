import { BaseModel } from "./base-model";

export class Project extends BaseModel {
  name: string = '';
  description: string = '';
  logoUrl: string = '';
}