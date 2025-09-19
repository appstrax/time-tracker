import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { OrganizationService } from '../../services/organization.service';
import { Organization } from '../../models/organization.model';
import {
  UserProjectOrganizations,
  UserService,
} from '../../services/user.service';
import { appstraxAuth, User } from '@appstrax/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-selector.component.html',
  styleUrls: ['./project-selector.component.scss'],
})
export class ProjectSelectorComponent implements OnInit {
  projects: Project[] = [];
  organizations: Organization[] = [];
  userProjectOrgs: UserProjectOrganizations = new UserProjectOrganizations();

  selectedProject: Project | null = null;
  isMenuOpen = false;
  expandedOrgIds = new Set<string>();

  constructor(
    private router: Router,
    private userService: UserService,
    private projectService: ProjectService,
    private organizationService: OrganizationService
  ) {}

  async ngOnInit(): Promise<void> {
    const user: User = await appstraxAuth.getUser();
    this.userProjectOrgs = await this.userService.getUserProjectOrganizations(
      user.id
    );

    if (
      !this.selectedProject &&
      this.userProjectOrgs.projects.length > 0
    ) {
      this.selectedProject = this.userProjectOrgs.projects[0];
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  selectProject(project: Project): void {
    this.selectedProject = project;
    this.isMenuOpen = false;
  }

  getProjectsForOrganization(orgId: string): Project[] {
    const projectIds = this.userProjectOrgs.orgProjects
      .filter((op) => op.organizationId === orgId)
      .map((op) => op.projectId);
    return this.userProjectOrgs.projects.filter((p) =>
      projectIds.includes(p.id)
    );
  }

  toggleOrg(orgId: string): void {
    if (this.expandedOrgIds.has(orgId)) {
      this.expandedOrgIds.delete(orgId);
    } else {
      this.expandedOrgIds.add(orgId);
    }
  }

  isOrgExpanded(orgId: string): boolean {
    return this.expandedOrgIds.has(orgId);
  }

  navToNewProject(): void {
    this.router.navigate(['/create-project']);
  }

  navToNewOrganization(): void {
    this.router.navigate(['/create-organization']);
  }
}
