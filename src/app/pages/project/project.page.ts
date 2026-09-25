import { FormsModule } from '@angular/forms';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { appstraxStorage } from '@appstrax/services/storage';

import { ToastService, ProjectService, ProjectUserService } from '@services';
import { Project, ProjectField, ProjectFieldType, ProjectUser, ProjectUserRole } from '@models';
import { Store } from '@state';
import { ProjectUsersComponent } from '@components';
import {
  normalizeProjectCategories,
  seedNewProjectCategories,
  validateProjectCategories,
} from '@utils';

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
  private readonly persistMode = signal<'core' | 'fields' | null>(null);
  readonly editing = signal(false);
  readonly fieldsError = signal('');

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

  private fieldOptionsDrafts: Record<number, string> = {};
  private savedFieldsSnapshot = '[]';
  private savedCoreSnapshot = {
    name: '',
    description: '',
    logoUrl: '',
    categories: [] as string[],
    allowCustomCategory: true,
  };

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
      if (project) {
        this.project.set(project);
        this.syncPersistedSnapshots(project);
      }

      try {
        const project = await this.projectService.findById(projectId);
        this.project.set(project);
        this.logoPreviewUrl.set(project.logoUrl || null);
        this.syncPersistedSnapshots(project);
      } catch (e) {
        this.toast.error('Failed to load project for editing', 'Error');
      }
    } else {
      this.updateProject((project) => seedNewProjectCategories(project));
    }
  }

  public isPersisting(): boolean {
    return this.persistMode() !== null;
  }

  public isSavingCore(): boolean {
    return this.persistMode() === 'core';
  }

  public isSavingFields(): boolean {
    return this.persistMode() === 'fields';
  }

  async saveProject(): Promise<void> {
    if (!this.beginPersist('core')) {
      return;
    }

    this.error.set('');

    try {
      if (!this.isCoreFormValid()) {
        return;
      }

      const hadUnsavedFieldEdits = this.editing() && this.areFieldsDirty();

      if (!this.editing()) {
        const fieldsValidationError = this.validateFields();
        if (fieldsValidationError) {
          this.error.set(fieldsValidationError);
          return;
        }
      }

      const logoFile = this.logoFile();
      if (logoFile) {
        await this.uploadProjectLogo(logoFile);
      }

      const submitted = this.buildProjectForCoreSave();
      const project = await this.projectService.save(submitted);

      this.project.set(
        this.mergeProjectAfterSave(project, this.liveEditOverrides(submitted)),
      );

      this.logoFile.set(null);
      this.syncPersistedSnapshots(project);

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
      if (hadUnsavedFieldEdits) {
        this.toast.info(
          'Custom field changes were not saved. Use Save fields when you are ready.',
          'Reminder',
        );
      }

      if (!this.editing() || !this.areFieldsDirty()) {
        this.router.navigate(['/projects']);
      }
    } catch (error: any) {
      this.error.set(error.message);
      this.toast.error(error.message || 'Failed to save project', 'Error');
    } finally {
      this.endPersist();
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
    this.error.set('');
    this.logoFile.set(file);

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreviewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  public isCoreFormValid(): boolean {
    const project = this.project();
    if (project.name == '' || project.description == '') {
      this.error.set('Project name and description are required');
      return false;
    }

    const categoryError = validateProjectCategories(project.categories);
    if (categoryError) {
      this.error.set(categoryError);
      return false;
    }

    return true;
  }

  public areFieldsDirty(): boolean {
    return (
      JSON.stringify(this.project().fields) !== this.savedFieldsSnapshot
    );
  }

  public areCoreDirty(): boolean {
    if (this.logoFile()) {
      return true;
    }

    const project = this.project();
    return (
      project.name !== this.savedCoreSnapshot.name ||
      project.description !== this.savedCoreSnapshot.description ||
      project.logoUrl !== this.savedCoreSnapshot.logoUrl ||
      JSON.stringify(project.categories) !==
        JSON.stringify(this.savedCoreSnapshot.categories) ||
      project.allowCustomCategory !== this.savedCoreSnapshot.allowCustomCategory
    );
  }

  public hasUnsavedEdits(): boolean {
    return this.areCoreDirty() || this.areFieldsDirty();
  }

  public canLeaveProjectPage(): boolean {
    if (this.isPersisting()) {
      return false;
    }

    if (!this.editing() || !this.project().id || !this.hasUnsavedEdits()) {
      return true;
    }

    return confirm(
      'You have unsaved project, category, or custom field changes. Leave without saving?',
    );
  }

  public canSaveFields(): boolean {
    if (!this.editing() || !this.project().id) {
      return false;
    }

    return this.areFieldsDirty();
  }

  async saveFields(): Promise<void> {
    this.fieldsError.set('');

    if (!this.editing() || !this.project().id) {
      this.fieldsError.set(
        'Create the project first, then save custom fields here.',
      );
      return;
    }

    if (!this.beginPersist('fields')) {
      return;
    }

    try {
      const hadUnsavedCoreEdits = this.areCoreDirty();

      const validationError = this.validateFields();
      if (validationError) {
        this.fieldsError.set(validationError);
        return;
      }
      const submitted = this.buildProjectForFieldsSave();
      const project = await this.projectService.save(submitted);

      this.project.set(
        this.mergeProjectAfterSave(project, this.liveEditOverrides(submitted)),
      );

      this.syncPersistedSnapshots(project);
      await this.refreshProjectsStore();
      this.toast.success('Custom fields saved', 'Success');
      if (hadUnsavedCoreEdits) {
        this.toast.info(
          'Project detail changes were not saved. Use Update Project when you are ready.',
          'Reminder',
        );
      }
    } catch (error: any) {
      this.fieldsError.set(error.message || 'Failed to save custom fields');
      this.toast.error(error.message || 'Failed to save custom fields', 'Error');
    } finally {
      this.endPersist();
    }
  }

  private beginPersist(mode: 'core' | 'fields'): boolean {
    if (this.persistMode() !== null) {
      return false;
    }

    this.persistMode.set(mode);
    return true;
  }

  private endPersist(): void {
    this.persistMode.set(null);
  }

  private validateFields(): string | null {
    const project = this.project();
    const seenKeys = new Set<string>();

    for (const field of project.fields) {
      if (!field.key.trim()) {
        return 'Every custom field needs a key';
      }
      if (seenKeys.has(field.key)) {
        return `Duplicate field key: "${field.key}"`;
      }
      seenKeys.add(field.key);

      if (field.type === 'select' && field.options.length === 0) {
        return `Field "${field.key}" is a select field but has no options`;
      }
    }

    return null;
  }

  private syncPersistedSnapshots(project: Project): void {
    this.savedFieldsSnapshot = JSON.stringify(project.fields);
    this.savedCoreSnapshot = {
      name: project.name,
      description: project.description,
      logoUrl: project.logoUrl,
      categories: [...project.categories],
      allowCustomCategory: project.allowCustomCategory,
    };
  }

  private parseSavedFields(): ProjectField[] {
    try {
      return JSON.parse(this.savedFieldsSnapshot) as ProjectField[];
    } catch {
      return [];
    }
  }

  private buildProjectForCoreSave(): Project {
    const current = this.project();
    const payload = Object.assign(new Project(), current);

    payload.categories = normalizeProjectCategories(current.categories);
    payload.allowCustomCategory = current.allowCustomCategory;

    if (this.editing()) {
      payload.fields = this.parseSavedFields().map((field) => ({ ...field }));
    }

    return payload;
  }

  private buildProjectForFieldsSave(): Project {
    const current = this.project();
    const payload = Object.assign(new Project(), current);

    payload.name = this.savedCoreSnapshot.name;
    payload.description = this.savedCoreSnapshot.description;
    payload.logoUrl = this.savedCoreSnapshot.logoUrl;
    payload.categories = [...this.savedCoreSnapshot.categories];
    payload.allowCustomCategory = this.savedCoreSnapshot.allowCustomCategory;

    return payload;
  }

  private mergeProjectAfterSave(
    saved: Project,
    overrides: Partial<Project> = {},
  ): Project {
    const current = this.project();
    const merged = Object.assign(new Project(), current, saved, overrides);
    merged.users = current.users;
    return merged;
  }

  /**
   * Preserves any edits made to the live form while a save request was in
   * flight. Compares the current (post-await) form state against what was
   * actually submitted; anything that changed since submission wins over
   * the (now stale) server response.
   */
  private liveEditOverrides(submitted: Project): Partial<Project> {
    const live = this.project();
    const overrides: Partial<Project> = {};

    if (live.name !== submitted.name) overrides.name = live.name;
    if (live.description !== submitted.description) {
      overrides.description = live.description;
    }
    if (live.logoUrl !== submitted.logoUrl) overrides.logoUrl = live.logoUrl;
    if (JSON.stringify(live.fields) !== JSON.stringify(submitted.fields)) {
      overrides.fields = live.fields;
    }
    if (JSON.stringify(live.categories) !== JSON.stringify(submitted.categories)) {
      overrides.categories = live.categories;
    }
    if (live.allowCustomCategory !== submitted.allowCustomCategory) {
      overrides.allowCustomCategory = live.allowCustomCategory;
    }

    return overrides;
  }

  public updateProjectName(name: string): void {
    this.error.set('');
    this.updateProject((project) => {
      project.name = name;
    });
  }

  public updateProjectDescription(description: string): void {
    this.error.set('');
    this.updateProject((project) => {
      project.description = description;
    });
  }

  public addCategory(): void {
    this.error.set('');
    this.updateProject((project) => {
      project.categories = [...project.categories, ''];
    });
  }

  public removeCategory(index: number): void {
    this.error.set('');
    this.updateProject((project) => {
      project.categories = project.categories.filter((_, i) => i !== index);
    });
  }

  public moveCategoryUp(index: number): void {
    if (index <= 0) return;
    this.error.set('');
    this.updateProject((project) => {
      const categories = [...project.categories];
      [categories[index - 1], categories[index]] = [
        categories[index],
        categories[index - 1],
      ];
      project.categories = categories;
    });
  }

  public moveCategoryDown(index: number): void {
    this.updateProject((project) => {
      if (index >= project.categories.length - 1) return;
      this.error.set('');
      const categories = [...project.categories];
      [categories[index], categories[index + 1]] = [
        categories[index + 1],
        categories[index],
      ];
      project.categories = categories;
    });
  }

  public updateCategoryAt(index: number, value: string): void {
    this.error.set('');
    this.updateProject((project) => {
      const categories = [...project.categories];
      categories[index] = value;
      project.categories = categories;
    });
  }

  public updateAllowCustomCategory(allow: boolean): void {
    this.error.set('');
    this.updateProject((project) => {
      project.allowCustomCategory = allow;
    });
  }

  public addField(): void {
    this.fieldsError.set('');
    this.updateProject((project) => {
      project.fields = [
        ...project.fields,
        { key: '', label: '', type: 'text', required: false, options: [] },
      ];
    });
  }

  public removeField(index: number): void {
    this.fieldOptionsDrafts = {};
    this.fieldsError.set('');
    this.updateProject((project) => {
      project.fields = project.fields.filter((_, i) => i !== index);
    });
  }

  public moveFieldUp(index: number): void {
    if (index <= 0) return;
    this.fieldOptionsDrafts = {};
    this.fieldsError.set('');
    this.updateProject((project) => {
      const fields = [...project.fields];
      [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
      project.fields = fields;
    });
  }

  public moveFieldDown(index: number): void {
    this.updateProject((project) => {
      if (index >= project.fields.length - 1) return;
      this.fieldOptionsDrafts = {};
      this.fieldsError.set('');
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
    this.fieldOptionsDrafts[index] = optionsText;
    const options = optionsText
      .split(',')
      .map((option) => option.trim())
      .filter((option) => option.length > 0);
    this.updateFieldAt(index, (field) => (field.options = options));
  }

  public fieldOptionsText(index: number, field: ProjectField): string {
    return this.fieldOptionsDrafts[index] ?? field.options.join(', ');
  }

  private updateFieldAt(index: number, updateFn: (field: ProjectField) => void): void {
    this.fieldsError.set('');
    this.updateProject((project) => {
      const fields = project.fields.map((field, i) =>
        i === index ? { ...field } : field,
      );
      updateFn(fields[index]);
      project.fields = fields;
    });
  }

  public onProjectUsersChange(project: Project): void {
    this.updateProject((current) => {
      current.users = project.users;
    });
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
