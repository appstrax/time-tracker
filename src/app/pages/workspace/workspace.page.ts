import { Component, Signal, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@state';
import { ToastService } from '../../services/toast.service';
import { Project, Organization, OrganizationProjects } from '@models';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.page.html',
  styleUrls: ['./workspace.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class WorkspacePage {
  activeTab: 'projects' | 'organizations' = 'projects';
  search = signal<string>('');

  projects!: Signal<Project[]>;
  organizations!: Signal<Organization[]>;
  orgProjects!: Signal<OrganizationProjects[]>;

  filteredProjects = computed(() => {
    const q = (this.search() || '').toLowerCase();
    if (!q) return this.projects();
    return this.projects().filter((p: any) =>
      [p?.name, p?.description].some((v: string) => (v || '').toLowerCase().includes(q))
    );
  });

  filteredOrganizations = computed(() => {
    const q = (this.search() || '').toLowerCase();
    if (!q) return this.organizations();
    return this.organizations().filter((o: any) =>
      [o?.name, o?.email, o?.website, o?.city, o?.country]
        .some((v: string) => (v || '').toLowerCase().includes(q))
    );
  });

  constructor(
    private store: Store,
    private toast: ToastService,
  ) {
    this.projects = this.store.projects.all;
    this.organizations = this.store.organizations.all;
    this.orgProjects = this.store.orgProjects.all;
    effect(() => {
      if (this.projects().length === 0 && this.organizations().length > 0) {
        this.activeTab = 'organizations';
      }
    });
  }

  setCurrentProject(projectId: string) {
    this.store.selectedProjectId.set(projectId);
    const orgId = this.orgProjects().find((op) => op.projectId === projectId)?.organizationId ?? null;
    if (orgId) this.store.selectedOrganizationId.set(orgId);
  }

  setCurrentOrganization(orgId: string) {
    this.store.selectedOrganizationId.set(orgId);
  }

  getProjectCountForOrg(orgId: string): number {
    try {
      return this.orgProjects().filter((op: any) => op.organizationId === orgId).length || 0;
    } catch {
      return 0;
    }
  }

  async deleteProject(projectId: string) {
    const ok = confirm('Delete this project? This cannot be undone.');
    if (!ok) return;
    try {
      await this.store.projects.delete(projectId);
      this.toast.success('Project deleted', 'Success');
    } catch (e) {
      this.toast.error('Failed to delete project', 'Error');
    }
  }

  async deleteOrganization(orgId: string) {
    const ok = confirm('Delete this organization? This cannot be undone.');
    if (!ok) return;
    try {
      await this.store.organizations.delete(orgId);
      this.toast.success('Organization deleted', 'Success');
    } catch (e) {
      this.toast.error('Failed to delete organization', 'Error');
    }
  }

  editProject(projectId: string) {
    this.toast.info('Edit project coming soon', 'Info');
  }

  editOrganization(orgId: string) {
    this.toast.info('Edit organization coming soon', 'Info');
  }
}


