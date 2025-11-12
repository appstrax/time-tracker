import { OnInit, OnDestroy } from '@angular/core';
import { ElementRef, HostListener } from '@angular/core';
import { Signal, effect, Component } from '@angular/core';

import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Store } from '@state';
import { Project, Organization, OrganizationProjects } from '@models';

@Component({
  selector: 'app-project-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-selector.component.html',
  styleUrls: ['./project-selector.component.scss'],
})
export class ProjectSelectorComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  expandedOrgIds = new Set<string>();
  selectedProject: Project | null = null;
  isCollapsed = false;

  private idleTimeoutId: any = null;
  private readonly collapseDelayMs = 3000;

  projects: Signal<Project[]>;
  organizations: Signal<Organization[]>;
  orgProjects: Signal<OrganizationProjects[]>;

  constructor(
    private store: Store,
    private router: Router,
    private elementRef: ElementRef
  ) {
    this.projects = this.store.projects.all;
    this.orgProjects = this.store.orgProjects.all;
    this.organizations = this.store.organizations.all;

    this.setInitialProject();
  }

  ngOnInit(): void {
    this.startIdleTimer();
  }

  ngOnDestroy(): void {
    this.clearIdleTimer();
  }

  setInitialProject() {
    effect(() => {
      const loadedAt = this.store.projects.loadedAt();
      if (loadedAt && !this.selectedProject) {
        const first = this.projects()[0] ?? null;
        if (first) {
          this.selectedProject = first;
          this.store.selectedProjectId.set(first.id);
          const orgId = this.orgProjects().find((op) => op.projectId === first.id)?.organizationId ?? null;
          if (orgId) this.store.selectedOrganizationId.set(orgId);
        }
      }
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.expand();
    if (this.isMenuOpen) {
      this.clearIdleTimer();
    } else {
      this.startIdleTimer();
    }
  }

  selectProject(project: Project): void {
    this.selectedProject = project;
    this.isMenuOpen = false;
    this.expand();
    this.startIdleTimer();
    this.store.selectedProjectId.set(project.id);
    const orgId = this.orgProjects().find((op) => op.projectId === project.id)?.organizationId ?? null;
    if (orgId) this.store.selectedOrganizationId.set(orgId);
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
    this.expand();
    this.startIdleTimer();
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
      this.expand();
      this.startIdleTimer();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
      this.expand();
      this.startIdleTimer();
    }
  }

  onMouseEnterButton(): void {
    this.expand();
    this.clearIdleTimer();
  }

  onMouseLeaveButton(): void {
    if (!this.isMenuOpen) this.startIdleTimer();
  }

  private expand(): void {
    this.isCollapsed = false;
  }

  private collapse(): void {
    if (this.isMenuOpen) return;
    this.isCollapsed = true;
  }

  private startIdleTimer(): void {
    this.clearIdleTimer();
    this.idleTimeoutId = setTimeout(() => {
      this.collapse();
    }, this.collapseDelayMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimeoutId) {
      clearTimeout(this.idleTimeoutId);
      this.idleTimeoutId = null;
    }
  }

  navToNewProject(): void {
    this.router.navigate(['/create-project'], {
      queryParams: { from: 'home' },
    });
  }

  navToNewOrganization(): void {
    this.router.navigate(['/create-organization'], {
      queryParams: { from: 'home' },
    });
  }
}
