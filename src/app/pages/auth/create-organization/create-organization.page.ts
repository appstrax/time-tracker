import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Router, RouterModule } from '@angular/router';
import { Organization } from '../../../models/organization.model';
import {
  OrganizationService,
  OrganizationUsersService,
} from '../../../services/organization.service';
import { appstraxAuth, User } from '@appstrax/services/auth';
import { appstraxStorage } from '@appstrax/services/storage';
import {
  OrganizationUsers,
  OrgUserRoles,
} from '../../../models/many-to-many.model';

@Component({
  selector: 'app-create-organization',
  templateUrl: './create-organization.page.html',
  styleUrls: ['./create-organization.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class CreateOrganizationPage {
  isLoading: boolean = false;
  errorMessage: string = '';
  logoFile: File | null = null;
  logoPreviewUrl: string | null = null;
  organization: Organization = new Organization();
  orgUser: OrganizationUsers = new OrganizationUsers();

  constructor(
    private router: Router,
    private organizationService: OrganizationService,
    private organizationUsersService: OrganizationUsersService
  ) {}

  async createOrganization(): Promise<void> {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please enter all required fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user: User = await appstraxAuth.getUser();

      if (this.logoFile) {
        await this.uploadOrganizationLogo(this.logoFile);
      }

      this.organization = await this.organizationService.save(this.organization);

      this.orgUser.organizationId = this.organization.id;
      this.orgUser.userId = user.id;
      this.orgUser.role = OrgUserRoles.ADMIN;

      this.orgUser = await this.organizationUsersService.save(this.orgUser);

      if (this.organization && this.orgUser) {
        this.router.navigate(['/create-project']);
      }
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.isLoading = false;
    }
  }

  public async uploadOrganizationLogo(file: File) {
    const response = await appstraxStorage.uploadFile(file, 'organizationLogos');
    this.organization.logoUrl = response.downloadUrl;
  }

  public onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.logoFile = null;
      this.logoPreviewUrl = null;
      return;
    }

    const file = input.files[0];
    this.logoFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  public isFormValid() {
    return (
      this.organization.name &&
      this.organization.description &&
      this.organization.country &&
      this.organization.email &&
      this.organization.address &&
      this.organization.city &&
      this.organization.state &&
      this.organization.zip &&
      this.organization.phone
    );
  }
}
