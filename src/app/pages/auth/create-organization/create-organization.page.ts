import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Router, RouterModule } from '@angular/router';
import { Organization } from '../../../models/organization.model';

@Component({
  selector: 'app-create-organization',
  templateUrl: './create-organization.page.html',
  styleUrls: ['./create-organization.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class CreateOrganizationPage {
  organization: Organization = new Organization();

  constructor(private router: Router) {}

  public async submit() {
    console.log('Submitting organization: ', this.organization);
    this.router.navigate(['/create-project']);
  }
}
