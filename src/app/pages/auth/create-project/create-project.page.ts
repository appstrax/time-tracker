import { Component, OnInit } from '@angular/core';
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
  OrganizationUsers,
  OrganizationProjects,
  ProjectOrgRoles,
  ProjectUserRoles,
  ProjectUsers,
} from '../../../models/many-to-many.model';
import { appstraxStorage } from '@appstrax/services/storage';
import {
  OrganizationProjectsService,
  OrganizationService,
  OrganizationUsersService,
} from '../../../services/organization.service';
import { Organization } from '../../../models/organization.model';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.page.html',
  styleUrls: ['./create-project.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class CreateProjectPage implements OnInit {
  project: Project = new Project();
  projectUser: ProjectUsers = new ProjectUsers();
  organization: Organization = new Organization();
  orgUser: OrganizationUsers = new OrganizationUsers();
  orgProject: OrganizationProjects = new OrganizationProjects();

  step: number = 1;
  errorMessage: string = '';

  isLoading: boolean = false;
  allFeaturesEnabled: boolean = false;

  logoFile: File | null = null;
  logoPreviewUrl: string | null = null;

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private organizationService: OrganizationService,
    private projectUsersService: ProjectUsersService,
    private orgUsersService: OrganizationUsersService,
    private orgProjectsService: OrganizationProjectsService
  ) {}

  ngOnInit(): void {
    this.getUsersOrganization();
  }

  public async getUsersOrganization() {
    this.isLoading = true;
    try {
      const user: User = await appstraxAuth.getUser();
      const orgUsers = await this.orgUsersService.find({
        where: { userId: user.id },
      });
      this.orgUser = orgUsers.data[0];
      if (!this.orgUser) {
        this.router.navigate(['/create-organization']);
      }
      const org = await this.organizationService.find({
        where: { id: this.orgUser.organizationId },
      });
      this.organization = org.data[0];
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.isLoading = false;
    }
  }

  public nextStep() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please enter all required fields';
      return;
    }
    if (this.step < 2) this.step = 2;
  }

  public prevStep() {
    if (this.step > 1) this.step = 1;
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
    if (!this.noFieldsToggled()) {
      this.errorMessage = 'Really...A project with no features?';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user: User = await appstraxAuth.getUser();
      if (this.logoFile) await this.uploadProjectLogo(this.logoFile);

      this.project = await this.projectService.save(this.project);

      this.projectUser.projectId = this.project.id;
      this.projectUser.userId = user.id;
      this.projectUser.role = ProjectUserRoles.ADMIN;

      this.projectUser = await this.projectUsersService.save(this.projectUser);

      this.orgProject.projectId = this.project.id;
      this.orgProject.organizationId = this.organization.id;
      this.orgProject.role = ProjectOrgRoles.PROVIDER;

      this.orgProject = await this.orgProjectsService.save(this.orgProject);

      if (this.project && this.projectUser && this.orgProject) {
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

  public noFieldsToggled(): boolean {
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

  public isFormValid(): boolean {
    return (this.project.name != '' && this.project.description != '');
  }
}
