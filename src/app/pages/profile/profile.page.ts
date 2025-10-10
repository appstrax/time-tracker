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
  constructor() {}

  public async ngOnInit(): Promise<void> {
    this.user.name = 'John';
    this.user.surname = 'Blew-eyes';
    this.user.email = 'john.doe@example.com';
    this.user.profilePictureUrl =
      'data:image/png;base64,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';
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
