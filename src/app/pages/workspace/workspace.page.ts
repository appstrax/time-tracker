import { Component, Signal, TemplateRef, ViewChild, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@state';
import { ToastService } from '../../services/toast.service';
import { ModalService } from '../../services/modal.service';
import { Project, Organization, OrganizationProjects } from '@models';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.page.html',
  styleUrls: ['./workspace.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgbTooltip],
})
export class WorkspacePage {
  @ViewChild('deleteProjectModal') deleteProjectModal!: TemplateRef<any>;
  @ViewChild('deleteOrganizationModal') deleteOrganizationModal!: TemplateRef<any>;
  activeTab: 'projects' | 'organizations' = 'projects';
  search = signal<string>('');
  deletingProject = false;
  deletingOrganization = false;

  projects!: Signal<Project[]>;
  organizations!: Signal<Organization[]>;
  orgProjects!: Signal<OrganizationProjects[]>;

  private projectUserCounts: Record<string, number> = {};
  private orgUserCounts: Record<string, number> = {};
  projectPendingDelete: Project | null = null;
  organizationPendingDelete: Organization | null = null;

  filteredProjects = computed(() => {
    const q = (this.search() || '').toLowerCase();
    const items = this.projects().map((p) => ({
      project: p,
      orgName: (this.getOrganizationNameForProject(p.id) || '').toLowerCase(),
    }));
    const filtered = q
      ? items.filter(({ project, orgName }) =>
          [project?.name, project?.description, orgName].some((v: string) =>
            (v || '').toLowerCase().includes(q)
          )
        )
      : items;
    filtered.sort((a, b) => {
      const byOrg = a.orgName.localeCompare(b.orgName);
      if (byOrg !== 0) return byOrg;
      return (a.project.name || '').localeCompare(b.project.name || '');
    });
    return filtered.map((x) => x.project);
  });

  filteredOrganizations = computed(() => {
    const q = (this.search() || '').toLowerCase();
    const items = this.organizations();
    const filtered = q
      ? items.filter((o: any) =>
          [o?.name, o?.email, o?.website, o?.city, o?.country]
            .some((v: string) => (v || '').toLowerCase().includes(q))
        )
      : items.slice();
    filtered.sort((a: any, b: any) => (a?.name || '').localeCompare(b?.name || ''));
    return filtered;
  });

  constructor(
    private store: Store,
    private toast: ToastService,
    private router: Router,
    private modal: ModalService,
  ) {
    this.projects = this.store.projects.all;
    this.organizations = this.store.organizations.all;
    this.orgProjects = this.store.orgProjects.all;
    effect(() => {
      if (!this.projects().length && this.organizations().length) {
        this.activeTab = 'organizations';
      }
    });
    // Preload user counts for visible entities
    effect(() => {
      // Project user counts
      for (const p of this.projects()) {
        if (!this.projectUserCounts[p.id]) {
          this.store.projUsers
            .find({ where: { projectId: p.id } as any })
            .then((res) => (this.projectUserCounts[p.id] = (res.data || []).length))
            .catch(() => (this.projectUserCounts[p.id] = 0));
        }
      }
      // Organization user counts
      for (const o of this.organizations()) {
        if (!this.orgUserCounts[o.id]) {
          this.store.orgUsers
            .find({ where: { organizationId: o.id } as any })
            .then((res) => (this.orgUserCounts[o.id] = (res.data || []).length))
            .catch(() => (this.orgUserCounts[o.id] = 0));
        }
      }
    });
  }

  setCurrentProject(projectId: string) {
    this.store.selectedProjectId.set(projectId);
    const orgId = this.orgProjects().find((op) => op.projectId === projectId)?.organizationId ?? null;
    if (orgId) this.store.selectedOrganizationId.set(orgId);
  }

  getProjectCountForOrg(orgId: string): number {
    try {
      return this.orgProjects().filter((op: any) => op.organizationId === orgId).length || 0;
    } catch {
      return 0;
    }
  }

  getOrganizationNameForProject(projectId: string): string {
    try {
      const mapping = this.orgProjects().find((op) => op.projectId === projectId);
      if (!mapping) return '';
      const org = this.organizations().find((o) => o.id === mapping.organizationId);
      return org?.name || '';
    } catch {
      return '';
    }
  }

  getUserCountForProject(projectId: string): number {
    return this.projectUserCounts[projectId] ?? 0;
  }

  getUserCountForOrganization(orgId: string): number {
    return this.orgUserCounts[orgId] ?? 0;
  }

  openDeleteProjectModal(p: Project) {
    this.projectPendingDelete = p;
    this.modal.open(this.deleteProjectModal, { centered: true, backdrop: 'static', keyboard: true });
  }

  closeDeleteProjectModal() {
    this.projectPendingDelete = null;
    this.deletingProject = false;
    this.modal.dismiss();
  }

  async confirmDeleteProject() {
    if (!this.projectPendingDelete) return;
    try {
      this.deletingProject = true;
      const projectId = this.projectPendingDelete.id;
      // Load all related links to ensure full cleanup
      const [projUsersRes, orgProjRes] = await Promise.all([
        this.store.projUsers.find({ where: { projectId } as any }),
        this.store.orgProjects.find({ where: { projectId } as any }),
      ]);
      const projUsers = projUsersRes.data ?? [];
      const orgMappings = orgProjRes.data ?? [];
      // Delete project-user links
      for (const link of projUsers) {
        await this.store.projUsers.delete(link.id);
      }
      // Delete organization-project links
      for (const mapping of orgMappings) {
        await this.store.orgProjects.delete(mapping.id);
      }
      // Finally, delete the project
      await this.store.projects.delete(projectId);
      this.toast.success('Project deleted', 'Success');
      this.modal.close();
    } catch (e) {
      this.toast.error('Failed to delete project', 'Error');
    } finally {
      this.deletingProject = false;
      this.projectPendingDelete = null;
    }
  }

  async deleteOrganization(orgId: string) {
    // Block deletion if organization has projects
    const numProjects = this.getProjectCountForOrg(orgId);
    if (numProjects > 0) {
      this.toast.error('You cannot delete an organization that still has projects', 'Blocked');
      return;
    }
    const org = this.organizations().find((o) => o.id === orgId) || null;
    if (!org) return;
    this.organizationPendingDelete = org;
    this.modal.open(this.deleteOrganizationModal, { centered: true, backdrop: 'static', keyboard: true });
  }

  editProject(projectId: string) {
    this.router.navigate(['/create-project'], {
      queryParams: { from: 'home', editId: projectId },
    });
  }

  editOrganization(orgId: string) {
    this.router.navigate(['/create-organization'], {
      queryParams: { from: 'home', editId: orgId },
    });
  }

  closeDeleteOrganizationModal() {
    this.organizationPendingDelete = null;
    this.deletingOrganization = false;
    this.modal.dismiss();
  }

  async confirmDeleteOrganization() {
    if (!this.organizationPendingDelete) return;
    try {
      this.deletingOrganization = true;
      const orgId = this.organizationPendingDelete.id;
      // Extra safety: remove any org-project mappings (should be none if blocked above)
      const [orgUsersRes, orgProjRes] = await Promise.all([
        this.store.orgUsers.find({ where: { organizationId: orgId } as any }),
        this.store.orgProjects.find({ where: { organizationId: orgId } as any }),
      ]);
      const orgUsers = orgUsersRes.data ?? [];
      const orgMappings = orgProjRes.data ?? [];
      for (const ou of orgUsers) {
        await this.store.orgUsers.delete(ou.id);
      }
      for (const mapping of orgMappings) {
        await this.store.orgProjects.delete(mapping.id);
      }
      await this.store.organizations.delete(orgId);
      this.toast.success('Organization deleted', 'Success');
      this.modal.close();
    } catch (e) {
      this.toast.error('Failed to delete organization', 'Error');
    } finally {
      this.deletingOrganization = false;
      this.organizationPendingDelete = null;
    }
  }
}


