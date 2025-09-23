import { Component, HostListener, ElementRef, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/project.model';
import { Router } from '@angular/router';
import { Store } from '../../state/init.store';
import { Organization } from '../../models/organization.model';
import { OrganizationProjects } from '../../models/many-to-many.model';
import { effect } from '@angular/core';

@Component({
  selector: 'app-project-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-selector.component.html',
  styleUrls: ['./project-selector.component.scss'],
})
export class ProjectSelectorComponent {
  selectedProject: Project | null = null;
  isMenuOpen = false;
  expandedOrgIds = new Set<string>();

  organizations: Signal<Organization[]>;
  projects: Signal<Project[]>;
  orgProjects: Signal<OrganizationProjects[]>;

  constructor(
    private store: Store,
    private router: Router,
    private elementRef: ElementRef
  ) {
    this.organizations = this.store.organizations.all;
    this.projects = this.store.projects.all;
    this.orgProjects = this.store.orgProjects.all;

    this.setInitialProject();
  }

  setInitialProject() {
    effect(() => {
      const loadedAt = this.store.projects.loadedAt();
      if (loadedAt && !this.selectedProject) {
        const first = this.projects()[0] ?? null;
        if (first) this.selectedProject = first;
      }
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  selectProject(project: Project): void {
    this.selectedProject = project;
    this.isMenuOpen = false;
  }

  getProjectsForOrganization(orgId: string): Project[] {
    const projectIds = this.orgProjects()
      .filter((op) => op.organizationId === orgId)
      .map((op) => op.projectId);
    return this.projects().filter((p) => projectIds.includes(p.id));
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isMenuOpen) return;
    const target = event.target as HTMLElement;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.isMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }

  navToNewProject(): void {
    this.router.navigate(['/create-project']);
  }

  navToNewOrganization(): void {
    this.router.navigate(['/create-organization']);
  }
}
