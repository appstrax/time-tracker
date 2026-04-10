import { FormsModule } from '@angular/forms';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { appstraxStorage } from '@appstrax/services/storage';

import { ToastService, ProjectService, ProjectUserService } from '@services';
import { Project, ProjectUser, ProjectUserRole } from '@models';
import { Store } from '@state';
import { ProjectUsersComponent } from '@components';

@Component({
  selector: 'app-create-project',
  templateUrl: './project.page.html',
  styleUrls: ['./project.page.scss'],
  standalone: true,
  imports: [FormsModule, RouterModule, ProjectUsersComponent],
})
export class ProjectPage implements OnInit {
  readonly project = signal(new Project());

  readonly error = signal('');
  readonly saving = signal(false);
  readonly editing = signal(false);

  readonly logoFile = signal<File | null>(null);
  readonly logoPreviewUrl = signal<string | null>(null);
  readonly projectUsersCount = computed(() => this.project().users.length);

  constructor(
    private store: Store,
    private router: Router,
    private toast: ToastService,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private projectUserService: ProjectUserService,
  ) {}

  async ngOnInit(): Promise<void> {
    const projectId = this.route.snapshot.queryParamMap.get('id');
    if (projectId) {
      this.editing.set(true);

      // Check if the project exists in the store, and set this.project if found.
      const projects = this.store.projects.projects();
      const project = projects.find((p: Project) => p.id === projectId);
      if (project) this.project.set(project);

      try {
        const project = await this.projectService.findById(projectId);
        this.project.set(project);
        this.logoPreviewUrl.set(project.logoUrl || null);
      } catch (e) {
        this.toast.error('Failed to load project for editing', 'Error');
      }
    }
  }

  async saveProject(): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      const logoFile = this.logoFile();
      if (logoFile) {
        await this.uploadProjectLogo(logoFile);
      }

      const project = await this.projectService.save(this.project());
      this.project.set(project);

      if (!this.editing()) {
        const user = this.store.user.user()!;
        const projectUser = new ProjectUser();
        projectUser.projectId = project.id;
        projectUser.userId = user.id;
        projectUser.role = ProjectUserRole.ADMIN;
        await this.projectUserService.save(projectUser);
      }

      await this.refreshProjectsStore();
      this.toast.success('Project saved successfully', 'Success');
      this.router.navigate(['/projects']);
    } catch (error: any) {
      this.error.set(error.message);
      this.toast.error(error.message || 'Failed to save project', 'Error');
    } finally {
      this.saving.set(false);
    }
  }

  private async uploadProjectLogo(file: File) {
    const response = await appstraxStorage.uploadFile(file, 'projectLogos');
    this.updateProject((project) => {
      project.logoUrl = response.downloadUrl;
    });
  }

  public onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.logoFile.set(null);
      this.logoPreviewUrl.set(null);
      return;
    }

    const file = input.files[0];
    this.logoFile.set(file);

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreviewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  public isFormValid(): boolean {
    const project = this.project();
    return project.name != '' && project.description != '';
  }

  public updateProjectName(name: string): void {
    this.updateProject((project) => {
      project.name = name;
    });
  }

  public updateProjectDescription(description: string): void {
    this.updateProject((project) => {
      project.description = description;
    });
  }

  public onProjectUsersChange(project: Project): void {
    this.project.set(project);
  }

  private async refreshProjectsStore(): Promise<void> {
    const user = this.store.user.user();
    if (!user) return;

    try {
      await this.store.projects.fetchUserProjects(user);
    } catch (error) {
      // Keep local UI responsive even if the background refresh fails.
    }
  }

  private updateProject(updateFn: (project: Project) => void): void {
    this.project.update((currentProject) => {
      const nextProject = Object.assign(new Project(), currentProject);
      updateFn(nextProject);
      return nextProject;
    });
  }
}
