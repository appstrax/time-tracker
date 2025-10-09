import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ProjectService, ProjectUsersService } from '@services';
import { UserService, OrganizationProjectsService } from '@services';

import { Project, ProjectUsers } from '@models';
import { Organization, OrganizationProjects } from '@models';
import { OrganizationUsers, ProjectOrgRoles, ProjectUserRoles } from '@models';

import { appstraxAuth, User } from '@appstrax/services/auth';
import { appstraxStorage } from '@appstrax/services/storage';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.page.html',
  styleUrls: ['./create-project.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class CreateProjectPage implements OnInit {
  project: Project = new Project();
  organizations: Organization[] = [];
  projectUser: ProjectUsers = new ProjectUsers();
  organization: Organization = new Organization();
  orgUser: OrganizationUsers = new OrganizationUsers();
  orgProject: OrganizationProjects = new OrganizationProjects();
  isOrgMenuOpen: boolean = false;

  step: number = 1;
  errorMessage: string = '';
 
  isLoading: boolean = false;
  allFeaturesEnabled: boolean = false;

  logoFile: File | null = null;
  logoPreviewUrl: string | null = null;
  backLink: string = '/create-organization';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private projectService: ProjectService,
    private projectUsersService: ProjectUsersService,
    private orgProjectsService: OrganizationProjectsService
  ) {}

  async ngOnInit(): Promise<void> {
    const from = this.route.snapshot.queryParamMap.get('from');
    this.backLink = from === 'home' ? '/home' : '/create-organization';
    await this.getUserOrganizations();
    if (this.organizations.length === 1) {
      this.organization = this.organizations[0];
    }
  }

  public async getUserOrganizations(): Promise<void> {
    this.isLoading = true;
    try {
      const user: User = await appstraxAuth.getUser();
      const result = await this.userService.getUserOrganizations(user.id);
      this.organizations = result;
      if (this.organizations.length === 1) {
        this.organization = this.organizations[0];
      }
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.isLoading = false;
    }
  }

  public onOrganizationChanged(organizationId: string) {
    const found = this.organizations.find((o) => o.id === organizationId);
    if (found) {
      this.organization = found;
    } else {
      this.organization = new Organization();
    }
  }

  public toggleOrgMenu(): void {
    this.isOrgMenuOpen = !this.isOrgMenuOpen;
  }

  public selectOrganization(org: Organization): void {
    this.organization = org;
    this.isOrgMenuOpen = false;
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
    return (
      this.project.name != '' &&
      this.project.description != '' &&
      this.organization.id != ''
    );
  }
}
