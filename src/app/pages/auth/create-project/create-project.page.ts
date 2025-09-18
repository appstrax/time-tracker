import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Router, RouterModule } from '@angular/router';
import { Project } from '../../../models/project.model';
import { appstraxAuth, User } from '@appstrax/services/auth';
import {
  ProjectService,
  ProjectUsersService,
} from '../../../services/project.service';
import {
  ProjectUserRoles,
  ProjectUsers,
} from '../../../models/many-to-many.model';
import { appstraxStorage } from '@appstrax/services/storage';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.page.html',
  styleUrls: ['./create-project.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class CreateProjectPage {
  project: Project = new Project();
  projectUser: ProjectUsers = new ProjectUsers();
  step: number = 1;
  allFeaturesEnabled: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;
  logoFile: File | null = null;
  logoPreviewUrl: string | null = null;

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private projectUsersService: ProjectUsersService
  ) {}

  public nextStep() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please enter all required fields';
      return;
    }
    if (this.step < 2) {
      this.step = 2;
    }
  }

  public prevStep() {
    if (this.step > 1) {
      this.step = 1;
    }
  }

  public setAllFeatures(enable: boolean) {
    type FeatureKey =
      | 'ticketManagement'
      | 'repoManagement'
      | 'billingManagement'
      | 'userManagement'
      | 'documentationManagement'
      | 'complianceManagement'
      | 'devOpsManagement'
      | 'guardrailsManagement'
      | 'qualityManagement'
      | 'auditManagement'
      | 'projectStateManagement'
      | 'statsManagement';

    const featureKeys: FeatureKey[] = [
      'ticketManagement',
      'repoManagement',
      'billingManagement',
      'userManagement',
      'documentationManagement',
      'complianceManagement',
      'devOpsManagement',
      'guardrailsManagement',
      'qualityManagement',
      'auditManagement',
      'projectStateManagement',
      'statsManagement',
    ];

    featureKeys.forEach((key) => (this.project[key] = enable));
    this.allFeaturesEnabled = enable;
  }

  public updateAllFeaturesFlag() {
    type FeatureKey =
      | 'ticketManagement'
      | 'repoManagement'
      | 'billingManagement'
      | 'userManagement'
      | 'documentationManagement'
      | 'complianceManagement'
      | 'devOpsManagement'
      | 'guardrailsManagement'
      | 'qualityManagement'
      | 'auditManagement'
      | 'projectStateManagement'
      | 'statsManagement';

    const featureKeys: FeatureKey[] = [
      'ticketManagement',
      'repoManagement',
      'billingManagement',
      'userManagement',
      'documentationManagement',
      'complianceManagement',
      'devOpsManagement',
      'guardrailsManagement',
      'qualityManagement',
      'auditManagement',
      'projectStateManagement',
      'statsManagement',
    ];

    this.allFeaturesEnabled = featureKeys.every((key) => !!this.project[key]);
  }

  async createProject(): Promise<void> {
    if (!this.isNoFieldsToggled()) {
      this.errorMessage = 'Really...A project with no features?';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user: User = await appstraxAuth.getUser();
      if (this.logoFile) {
        await this.uploadProjectLogo(this.logoFile);
      }

      this.project = await this.projectService.save(this.project);

      this.projectUser.projectId = this.project.id;
      this.projectUser.userId = user.id;
      this.projectUser.role = ProjectUserRoles.ADMIN;

      this.projectUser = await this.projectUsersService.save(this.projectUser);

      if (this.project && this.projectUser) {
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.isLoading = false;
    }
  }

  public async uploadProjectLogo(file: File) {
    const response = await appstraxStorage.uploadFile(file, 'projectLogos');
    this.project.logoUrl = response.downloadUrl;
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

  public isNoFieldsToggled() {
    return (
      this.project.ticketManagement &&
      this.project.repoManagement &&
      this.project.billingManagement &&
      this.project.userManagement &&
      this.project.documentationManagement &&
      this.project.complianceManagement &&
      this.project.devOpsManagement &&
      this.project.guardrailsManagement &&
      this.project.qualityManagement &&
      this.project.auditManagement &&
      this.project.projectStateManagement &&
      this.project.statsManagement
    );
  }

  public isFormValid() {
    return this.project.name && this.project.description;
  }
}
