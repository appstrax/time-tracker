import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, ElementRef, ViewChild } from '@angular/core';

import { User } from '@models';
import { SocialLinkComponent } from './social-link/social-link.component';

import { appstraxAuth } from '@appstrax/services/auth';
import { appstraxStorage } from '@appstrax/services/storage';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SocialLinkComponent],
})
export class ProfilePage {
  public user: User = new User();
  public socialLinks: any[] = [];

  public isSaving = false;
  public isEditingSocial = false;
  public isEditingPersonal = false;

  @ViewChild('fileInput', { static: false })
  fileInput?: ElementRef<HTMLInputElement>;

  @ViewChild('cvInput', { static: false })
  cvInput?: ElementRef<HTMLInputElement>;

  public async ngOnInit(): Promise<void> {
    try {
      const authUser = await appstraxAuth.getUser();
      if (authUser) {
        const data: any = (authUser as any)?.data ?? {};
        this.user.email = authUser.email || '';
        this.user.name = data.name || '';
        this.user.surname = data.surname || '';
        this.user.cvPdfUrl = data.cvPdfUrl || '';
        this.user.tiktokUrl = data.tiktokUrl || '';
        this.user.githubUrl = data.githubUrl || '';
        this.user.twitterUrl = data.twitterUrl || '';
        this.user.youtubeUrl = data.youtubeUrl || '';
        this.user.facebookUrl = data.facebookUrl || '';
        this.user.linkedinUrl = data.linkedinUrl || '';
        this.user.instagramUrl = data.instagramUrl || '';
        this.user.profilePictureUrl = data.profilePictureUrl || '';
      }
    } catch (err) {
      console.error('Failed to load user/profile data', err);
    }
  }

  onUploadProfilePicture(): void {
    const input = document.querySelector(
      'input[type="file"][accept^="image/"]'
    ) as HTMLInputElement | null;
    input?.click();
  }

  onUploadCV(): void {
    const input = document.getElementById('cvInput') as HTMLInputElement | null;
    input?.click();
  }

  async onCVSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    const file = target.files[0];
    try {
      const response = await appstraxStorage.uploadFile(file, 'userResumes');
      this.user.cvPdfUrl = response.downloadUrl;
      await this.updateUser();
    } catch (err) {
      console.error('CV upload failed', err);
    } finally {
      target.value = '';
    }
  }

  async onProfilePictureSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    const file = target.files[0];
    try {
      const response = await appstraxStorage.uploadFile(
        file,
        'userProfilePictures'
      );
      this.user.profilePictureUrl = response.downloadUrl;
      await this.updateUser();
    } catch (err) {
      console.error('Profile picture upload failed', err);
    } finally {
      target.value = '';
    }
  }

  async updateUser() {
    try {
      this.isSaving = true;
      await appstraxAuth.saveUserData({
        name: this.user.name,
        email: this.user.email,
        surname: this.user.surname,
        cvPdfUrl: this.user.cvPdfUrl,
        tiktokUrl: this.user.tiktokUrl,
        githubUrl: this.user.githubUrl,
        twitterUrl: this.user.twitterUrl,
        youtubeUrl: this.user.youtubeUrl,
        facebookUrl: this.user.facebookUrl,
        linkedinUrl: this.user.linkedinUrl,
        instagramUrl: this.user.instagramUrl,
        profilePictureUrl: this.user.profilePictureUrl,
      } as any);
      this.isEditingSocial = false;
      this.isEditingPersonal = false;
    } catch (err) {
      console.error('Failed to save', err);
    } finally {
      this.isSaving = false;
    }
  }

  togglePersonal() {
    this.isEditingPersonal = !this.isEditingPersonal;
  }

  toggleSocial() {
    this.isEditingSocial = !this.isEditingSocial;
  }
}
