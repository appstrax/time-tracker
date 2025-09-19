import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../models/user.model';
import { SocialLinkComponent } from './social-link/social-link.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, SocialLinkComponent],
})
export class ProfilePage {
  public user: User = new User();
  public socialLinks: any[] = [];
  constructor() {
  }

  public async ngOnInit(): Promise<void> {
    this.user.name = 'John';
    this.user.surname = 'Blew-eyes';
    this.user.email = 'john.doe@example.com';
    this.user.profilePictureUrl = 'https://caricom.org/wp-content/uploads/Floyd-Morris-Remake-1024x879-1-500x429.jpg';
    this.user.linkedinUrl = 'https://www.linkedin.com/in/john-doe-1234567890';
    this.user.githubUrl = 'https://github.com/john-doe';
    // this.user.twitterUrl = 'https://twitter.com/john-doe';
    // this.user.facebookUrl = 'https://www.facebook.com/john-doe';
    this.user.instagramUrl = 'https://www.instagram.com/john-doe';
    this.user.youtubeUrl = 'https://www.youtube.com/john-doe';
    this.user.tiktokUrl = 'https://www.tiktok.com/john-doe';

    this.socialLinks = [
      { type: 'linkedin', url: this.user.linkedinUrl },
      { type: 'github', url: this.user.githubUrl },
      { type: 'twitter', url: this.user.twitterUrl },
      { type: 'facebook', url: this.user.facebookUrl },
      { type: 'instagram', url: this.user.instagramUrl },
      { type: 'youtube', url: this.user.youtubeUrl },
      { type: 'tiktok', url: this.user.tiktokUrl },
    ];
  }
  
  // Placeholder methods for future implementation
  onSaveChanges(): void {
    // TODO: Implement save functionality
    console.log('Save changes clicked');
  }
  
  onReset(): void {
    // TODO: Implement reset functionality
    console.log('Reset clicked');
  }
  
  onChangePassword(): void {
    // TODO: Implement change password functionality
    console.log('Change password clicked');
  }
  
  onUploadProfilePicture(): void {
    // TODO: Implement profile picture upload
    console.log('Upload profile picture clicked');
  }
  
  onRemoveProfilePicture(): void {
    // TODO: Implement profile picture removal
    console.log('Remove profile picture clicked');
  }
  
  onUploadCV(): void {
    // TODO: Implement CV upload
    console.log('Upload CV clicked');
  }
} 