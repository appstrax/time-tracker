import { Model } from '@appstrax/services/shared/models/model';

export class User extends Model {
    public email: string = '';
    public password: string = '';

    // DATA FIELDS
    public name: string = '';
    public surname: string = '';
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