import { BaseModel } from './base-model';

export class User extends BaseModel {
    public firstName: string = '';
    public lastName: string = '';
    public email: string = '';
    public password: string = '';
    public confirmPassword: string = '';
}