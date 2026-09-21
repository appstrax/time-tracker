import { FormsModule } from '@angular/forms';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { appstraxStorage } from '@appstrax/services/storage';

import { ToastService, ProjectService, ProjectUserService } from '@services';
import { Project, ProjectField, ProjectFieldType, ProjectUser, ProjectUserRole } from '@models';
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

  readonly fieldTypeOptions: { value: ProjectFieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select' },
    { value: 'boolean', label: 'Yes/No' },
  ];

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
      if (!this.isFormValid()) {
        return;
      }

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
    if (project.name == '' || project.description == '') {
      this.error.set('Project name and description are required');
      return false;
    }

    const seenKeys = new Set<string>();
    for (const field of project.fields) {
      if (!field.key.trim()) {
        this.error.set('Every custom field needs a key');
        return false;
      }
      if (seenKeys.has(field.key)) {
        this.error.set(`Duplicate field key: "${field.key}"`);
        return false;
      }
      seenKeys.add(field.key);

      if (field.type === 'select' && field.options.length === 0) {
        this.error.set(
          `Field "${field.key}" is a select field but has no options`,
        );
        return false;
      }
    }

    return true;
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

  public addField(): void {
    this.updateProject((project) => {
      project.fields = [
        ...project.fields,
        { key: '', label: '', type: 'text', required: false, options: [] },
      ];
    });
  }

  public removeField(index: number): void {
    this.updateProject((project) => {
      project.fields = project.fields.filter((_, i) => i !== index);
    });
  }

  public moveFieldUp(index: number): void {
    if (index <= 0) return;
    this.updateProject((project) => {
      const fields = [...project.fields];
      [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
      project.fields = fields;
    });
  }

  public moveFieldDown(index: number): void {
    this.updateProject((project) => {
      if (index >= project.fields.length - 1) return;
      const fields = [...project.fields];
      [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
      project.fields = fields;
    });
  }

  public updateFieldKey(index: number, key: string): void {
    this.updateFieldAt(index, (field) => (field.key = key));
  }

  public updateFieldLabel(index: number, label: string): void {
    this.updateFieldAt(index, (field) => (field.label = label));
  }

  public updateFieldType(index: number, type: ProjectFieldType): void {
    this.updateFieldAt(index, (field) => {
      field.type = type;
      if (type !== 'select') {
        field.options = [];
      }
    });
  }

  public updateFieldRequired(index: number, required: boolean): void {
    this.updateFieldAt(index, (field) => (field.required = required));
  }

  public updateFieldOptionsText(index: number, optionsText: string): void {
    const options = optionsText
      .split(',')
      .map((option) => option.trim())
      .filter((option) => option.length > 0);
    this.updateFieldAt(index, (field) => (field.options = options));
  }

  public fieldOptionsText(field: ProjectField): string {
    return field.options.join(', ');
  }

  private updateFieldAt(index: number, updateFn: (field: ProjectField) => void): void {
    this.updateProject((project) => {
      const fields = project.fields.map((field, i) =>
        i === index ? { ...field } : field,
      );
      updateFn(fields[index]);
      project.fields = fields;
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
