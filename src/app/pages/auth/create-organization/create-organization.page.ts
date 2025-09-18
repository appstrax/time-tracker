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
      this.organization = await this.organizationService.save(
        this.organization
      );

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
