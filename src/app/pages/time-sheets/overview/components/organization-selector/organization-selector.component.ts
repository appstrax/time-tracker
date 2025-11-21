import { Component, Input, Output, EventEmitter, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@state';
import { Organization, Project } from '@models';
import { OrganizationProjectsBlockComponent } from '../organization-projects-block/organization-projects-block.component';
import { OrganizationBlockComponent } from '../organization-block/organization-block.component';

@Component({
  selector: 'app-organization-selector',
  standalone: true,
  imports: [CommonModule, OrganizationProjectsBlockComponent, OrganizationBlockComponent],
  templateUrl: './organization-selector.component.html',
  styleUrl: './organization-selector.component.scss'
})
export class OrganizationSelectorComponent {
  private store: Store = inject(Store);
  @Input() selectedOrganization: Organization | null = null;
  @Input() selectedProject: Project | null = null;

  @Output() organizationSelected = new EventEmitter<Organization | null>();
  @Output() projectSelected = new EventEmitter<Project | null>();

  public organizations: Signal<Organization[]>;

  constructor() {
    this.organizations = this.store.organizations.all;
  }

  public onOrganizationClick(organization: Organization | null): void {
    this.organizationSelected.emit(organization);
  }

  public isOrganizationSelected(organization: Organization | null): boolean {
    if (!organization && !this.selectedOrganization) return true;
    if (!organization || !this.selectedOrganization) return false;
    return organization.id === this.selectedOrganization.id;
  }

  public onProjectSelected(project: Project | null): void {
    this.projectSelected.emit(project);
  }
}

