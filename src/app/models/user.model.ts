import { BaseModel } from './base-model';

export class User extends BaseModel {
    public email: string = '';
    public password: string = '';

    // DATA FIELDS
    public firstName: string = '';
    public lastName: string = '';
    public confirmPassword: string = '';
    public profilePictureUrl: string = '';
    public cvPdfUrl: string = '';
    public linkedinUrl: string = '';
    public githubUrl: string = '';
    public twitterUrl: string = '';
    public facebookUrl: string = '';
    public instagramUrl: string = '';
    public youtubeUrl: string = '';
    public tiktokUrl: string = '';
}