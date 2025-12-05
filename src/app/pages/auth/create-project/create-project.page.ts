import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { appstraxAuth, User } from '@appstrax/services/auth';
import { appstraxStorage } from '@appstrax/services/storage';

import { ToastService } from '@services';

import { Project, ProjectUsers } from '@models';
import { Organization, OrganizationProjects } from '@models';
import { OrganizationUsers, ProjectOrgRoles, ProjectUserRoles } from '@models';

import { Store } from '@state';

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
  isEditMode: boolean = false;

  constructor(
    private store: Store,
    private router: Router,
    private toast: ToastService,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit(): Promise<void> {
    const from = this.route.snapshot.queryParamMap.get('from');
    this.backLink = from === 'home' ? '/home' : '/create-organization';

    this.organizations = this.store.organizations.all();

    if (this.organizations.length === 1) {
      this.organization = this.organizations[0];
    }

    // Default: enable all project features for ease of use
    this.setAllFeatures(true);

    // Edit mode: prefill project and org if editId is present
    const editId = this.route.snapshot.queryParamMap.get('editId');
    if (editId) {
      this.isEditMode = true;
      try {
        // Prefer local store; fall back to fetch
        const existing = this.store.projects.all().find((p) => p.id === editId);
        this.project = existing ?? (await this.store.projects.findById(editId));
        // Set preview to current logo if present
        this.logoPreviewUrl = this.project.logoUrl || null;
        // Resolve organization from orgProjects mapping
        const mapping = this.store.orgProjects.all().find((op) => op.projectId === this.project.id) ?? null;
        if (mapping) {
          this.orgProject = mapping;
          const org = this.store.organizations.all().find((o) => o.id === mapping.organizationId) ?? null;
          if (org) this.organization = org;
        }
        // Reflect feature toggles from project
        this.updateAllFeaturesFlag();
      } catch (e: any) {
        this.toast.error('Failed to load project for editing', 'Error');
      }
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
    this.isLoading = true;
    this.errorMessage = '';

    try {
      if (this.logoFile) await this.uploadProjectLogo(this.logoFile);

      if (this.isEditMode) {
        // Update existing project
        const originalOrgProject = this.store.orgProjects.all().find((op) => op.projectId === this.project.id) ?? null;
        this.project = await this.store.projects.save(this.project);
        // Update org mapping if organization changed
        if (originalOrgProject && this.organization?.id && originalOrgProject.organizationId !== this.organization.id) {
          const updated = { ...originalOrgProject, organizationId: this.organization.id } as OrganizationProjects;
          await this.store.orgProjects.save(updated);
        }
        this.toast.success('Project updated successfully', 'Success');
        this.router.navigate(['/home']);
      } else {
        if (!this.noFieldsToggled()) {
          this.errorMessage = 'Really...A project with no features?';
          return;
        }
        const user: User = await appstraxAuth.getUser();
        this.project = await this.store.projects.save(this.project);

        this.projectUser.projectId = this.project.id;
        this.projectUser.userId = user.id;
        this.projectUser.role = ProjectUserRoles.ADMIN;

        this.projectUser = await this.store.projUsers.save(this.projectUser);

        this.orgProject.projectId = this.project.id;
        this.orgProject.organizationId = this.organization.id;
        this.orgProject.role = ProjectOrgRoles.PROVIDER;

        this.orgProject = await this.store.orgProjects.save(this.orgProject);

        if (this.project && this.projectUser && this.orgProject) {
          this.toast.success('Project created successfully', 'Success');
          this.router.navigate(['/home']);
        }
      }
    } catch (error: any) {
      this.errorMessage = error.message;
      this.toast.error(error.message || (this.isEditMode ? 'Failed to update project' : 'Failed to create project'), 'Error');
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
