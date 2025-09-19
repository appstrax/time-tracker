import { Model } from '@appstrax/services/shared/models/model';

export class User extends Model {
    public email: string = '';
    public password: string = '';

    // DATA FIELDS
    public name: string = '';
    public surname: string = '';
    
    public cvPdfUrl: string = '';
    public profilePictureUrl: string = '';

    public facebookUrl: string = '';
    public githubUrl: string = '';
    public instagramUrl: string = '';
    public linkedinUrl: string = '';
    public tiktokUrl: string = '';
    public twitterUrl: string = '';
    public youtubeUrl: string = '';
}