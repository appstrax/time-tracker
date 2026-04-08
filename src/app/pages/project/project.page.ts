import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { appstraxAuth, User as AuthUser } from '@appstrax/services/auth';
import { appstraxStorage } from '@appstrax/services/storage';

import { ToastService } from '@services';
import { Project, ProjectUser, ProjectUserRole, User } from '@models';
import {
  ProjectService,
  ProjectUserService,
} from '../../services/project.service';
import { UsersService } from '../../services/user.service';

import { Store } from '@state';

interface ProjectMemberRecord {
  membership: ProjectUser;
  user: User | null;
}

@Component({
  selector: 'app-create-project',
  templateUrl: './project.page.html',
  styleUrls: ['./project.page.scss'],
  standalone: true,
  imports: [FormsModule, RouterModule],
})
export class ProjectPage implements OnInit {
  project: Project = new Project();

  projectUser: ProjectUser = new ProjectUser();

  step: number = 1;
  errorMessage: string = '';

  isLoading: boolean = false;
  allFeaturesEnabled: boolean = false;
  isProjectUsersLoading: boolean = false;
  isSearchingUsers: boolean = false;
  isAddingProjectUser: boolean = false;

  logoFile: File | null = null;
  logoPreviewUrl: string | null = null;
  backLink: string = '/home';
  isEditMode: boolean = false;
  projectUsersErrorMessage: string = '';
  projectMembers: ProjectMemberRecord[] = [];
  projectUserRoles: ProjectUserRole[] = Object.values(ProjectUserRole);
  projectUserSearchTerm: string = '';
  projectUserSearchResults: User[] = [];
  selectedProjectUser: User | null = null;
  selectedProjectUserRole: ProjectUserRole = ProjectUserRole.CONTRIBUTOR;
  isProjectUserSearchOpen: boolean = false;
  activeMemberUserId: string | null = null;
  workspaceUsers: User[] = [];

  private userSearchRequestId: number = 0;

  constructor(
    private store: Store,
    private router: Router,
    private toast: ToastService,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private projectUserService: ProjectUserService,
    private usersService: UsersService,
  ) {}

  async ngOnInit(): Promise<void> {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'home' || from === 'projects') {
      this.backLink = `/${from}`;
    }

    const workspaceUsersPromise = this.loadWorkspaceUsers();

    // Edit mode: prefill the existing project if editId is present
    const editId = this.route.snapshot.queryParamMap.get('editId');
    if (editId) {
      this.isEditMode = true;
      try {
        const existing = this.store.projects
          .projects()
          .find((p) => p.id === editId);
        this.project = existing ?? (await this.projectService.findById(editId));
        this.logoPreviewUrl = this.project.logoUrl || null;
        await workspaceUsersPromise;
        await this.loadProjectUsers();
      } catch (e: any) {
        this.toast.error('Failed to load project for editing', 'Error');
      }
    }

    await workspaceUsersPromise;
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

  async createProject(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      if (this.logoFile) await this.uploadProjectLogo(this.logoFile);

      if (this.isEditMode) {
        this.project = await this.projectService.save(this.project);
        await this.refreshProjectsStore();
        this.toast.success('Project updated successfully', 'Success');
        this.router.navigate([this.backLink]);
      } else {
        const user: AuthUser = await appstraxAuth.getUser();
        this.project = await this.projectService.save(this.project);

        this.projectUser.projectId = this.project.id;
        this.projectUser.userId = user.id;
        this.projectUser.role = ProjectUserRole.ADMIN;

        this.projectUser = await this.projectUserService.save(this.projectUser);

        if (this.project && this.projectUser) {
          await this.refreshProjectsStore();
          this.toast.success('Project created successfully', 'Success');
          this.router.navigate([this.backLink]);
        }
      }
    } catch (error: any) {
      this.errorMessage = error.message;
      this.toast.error(
        error.message ||
          (this.isEditMode
            ? 'Failed to update project'
            : 'Failed to create project'),
        'Error',
      );
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

  public isFormValid(): boolean {
    return this.project.name != '' && this.project.description != '';
  }

  public get projectUsersCount(): number {
    return this.projectMembers.length;
  }

  public get canAddProjectUser(): boolean {
    return !!this.project.id && !!this.selectedProjectUser && !this.isAddingProjectUser;
  }

  public async onProjectUserSearchInput(): Promise<void> {
    this.selectedProjectUser = null;
    await this.searchProjectUsers();
  }

  public onProjectUserSearchFocus(): void {
    if (this.projectUserSearchTerm.trim().length < 2) {
      return;
    }

    this.isProjectUserSearchOpen = true;

    if (!this.projectUserSearchResults.length && !this.isSearchingUsers) {
      void this.searchProjectUsers();
    }
  }

  public onProjectUserSearchBlur(): void {
    setTimeout(() => {
      this.isProjectUserSearchOpen = false;
    }, 150);
  }

  public selectProjectUser(user: User): void {
    this.selectedProjectUser = user;
    this.projectUserSearchTerm = this.getSearchResultLabel(user);
    this.isProjectUserSearchOpen = false;
  }

  public async addProjectUser(): Promise<void> {
    if (!this.project.id || !this.selectedProjectUser) {
      return;
    }

    if (this.projectMembers.some((member) => member.membership.userId === this.selectedProjectUser?.id)) {
      this.projectUsersErrorMessage = 'This user already belongs to the project.';
      return;
    }

    const projectUser = new ProjectUser();
    projectUser.projectId = this.project.id;
    projectUser.userId = this.selectedProjectUser.id;
    projectUser.role = this.selectedProjectUserRole;

    this.isAddingProjectUser = true;
    this.activeMemberUserId = this.selectedProjectUser.id;
    this.projectUsersErrorMessage = '';

    try {
      const savedProjectUser = await this.projectUserService.save(projectUser);

      this.projectMembers = this.sortProjectMembers([
        ...this.projectMembers,
        {
          membership: savedProjectUser,
          user: this.selectedProjectUser,
        },
      ]);

      this.syncProjectUsers();
      this.clearProjectUserSearch();
      await this.refreshProjectsStore();
      this.toast.success('Project user added', 'Success');
    } catch (error: any) {
      this.projectUsersErrorMessage = error.message || 'Failed to add project user.';
      this.toast.error(this.projectUsersErrorMessage, 'Error');
    } finally {
      this.isAddingProjectUser = false;
      this.activeMemberUserId = null;
    }
  }

  public async updateProjectUserRole(
    member: ProjectMemberRecord,
    nextRole: ProjectUserRole,
  ): Promise<void> {
    if (member.membership.role === nextRole) {
      return;
    }

    const previousRole = member.membership.role;
    member.membership.role = nextRole;
    this.activeMemberUserId = member.membership.userId;
    this.projectUsersErrorMessage = '';

    try {
      member.membership = await this.projectUserService.save(member.membership);
      this.projectMembers = this.sortProjectMembers([...this.projectMembers]);
      await this.refreshProjectsStore();
      this.toast.success('Project role updated', 'Success');
    } catch (error: any) {
      member.membership.role = previousRole;
      this.projectUsersErrorMessage =
        error.message || 'Failed to update the project role.';
      this.toast.error(this.projectUsersErrorMessage, 'Error');
    } finally {
      this.activeMemberUserId = null;
    }
  }

  public async removeProjectUser(member: ProjectMemberRecord): Promise<void> {
    const memberName = this.getDisplayName(member.user);
    const shouldRemove = window.confirm(
      `Remove ${memberName} from this project?`,
    );

    if (!shouldRemove) {
      return;
    }

    this.activeMemberUserId = member.membership.userId;
    this.projectUsersErrorMessage = '';

    try {
      await this.projectUserService.delete(member.membership.id);
      this.projectMembers = this.projectMembers.filter(
        (currentMember) => currentMember.membership.id !== member.membership.id,
      );
      this.syncProjectUsers();
      await this.refreshProjectsStore();
      this.toast.success('Project user removed', 'Success');
    } catch (error: any) {
      this.projectUsersErrorMessage =
        error.message || 'Failed to remove the project user.';
      this.toast.error(this.projectUsersErrorMessage, 'Error');
    } finally {
      this.activeMemberUserId = null;
    }
  }

  public isMemberBusy(member: ProjectMemberRecord): boolean {
    return this.activeMemberUserId === member.membership.userId;
  }

  public getDisplayName(user: User | null): string {
    if (!user) {
      return 'Unknown user';
    }

    const fullName = `${user.name} ${user.surname}`.trim();
    return fullName || user.email || user.id;
  }

  public getUserSecondaryText(user: User | null): string {
    if (!user) {
      return 'No email available';
    }

    return user.email || user.id;
  }

  public getUserInitials(user: User | null): string {
    const fallback = this.getDisplayName(user);
    const initials = fallback
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

    return initials || '?';
  }

  public formatRole(role: ProjectUserRole): string {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  private async loadProjectUsers(): Promise<void> {
    if (!this.project.id) {
      return;
    }

    this.isProjectUsersLoading = true;
    this.projectUsersErrorMessage = '';

    try {
      const projectUsers = await this.projectUserService.findByProjectId(
        this.project.id,
      );
      const users = await this.resolveUsers(projectUsers);

      this.projectMembers = this.buildProjectMembers(projectUsers, users);
      this.syncProjectUsers();
    } catch (error: any) {
      this.projectUsersErrorMessage =
        error.message || 'Failed to load project users.';
    } finally {
      this.isProjectUsersLoading = false;
    }
  }

  private async resolveUsers(projectUsers: ProjectUser[]): Promise<User[]> {
    const userIds = [...new Set(projectUsers.map((projectUser) => projectUser.userId))];

    if (!userIds.length) {
      return [];
    }

    const cachedUsers = this.workspaceUsers.filter((user) => userIds.includes(user.id));
    if (cachedUsers.length === userIds.length) {
      return cachedUsers;
    }

    return this.usersService.findByUserIds(userIds);
  }

  private async loadWorkspaceUsers(): Promise<void> {
    try {
      this.workspaceUsers = await this.usersService.fetchUsers();
    } catch (error: any) {
      this.workspaceUsers = [];

      if (this.isEditMode) {
        this.projectUsersErrorMessage =
          error.message || 'Failed to load workspace users.';
      }
    }
  }

  private buildProjectMembers(
    projectUsers: ProjectUser[],
    users: User[],
  ): ProjectMemberRecord[] {
    const usersById = new Map(users.map((user) => [user.id, user]));

    return this.sortProjectMembers(
      projectUsers.map((projectUser) => ({
        membership: projectUser,
        user: usersById.get(projectUser.userId) ?? null,
      })),
    );
  }

  private sortProjectMembers(
    members: ProjectMemberRecord[],
  ): ProjectMemberRecord[] {
    return [...members].sort((left, right) =>
      this.getDisplayName(left.user).localeCompare(this.getDisplayName(right.user)),
    );
  }

  private syncProjectUsers(): void {
    this.project.users = this.projectMembers
      .map((member) => member.user)
      .filter((user): user is User => !!user);
  }

  private async searchProjectUsers(): Promise<void> {
    const trimmedTerm = this.projectUserSearchTerm.trim();
    this.projectUsersErrorMessage = '';

    if (trimmedTerm.length < 2) {
      this.projectUserSearchResults = [];
      this.isProjectUserSearchOpen = false;
      this.isSearchingUsers = false;
      return;
    }

    const currentRequestId = ++this.userSearchRequestId;
    this.isSearchingUsers = true;
    this.isProjectUserSearchOpen = true;

    try {
      const normalizedTerm = trimmedTerm.toLowerCase();
      const existingUserIds = new Set(
        this.projectMembers.map((member) => member.membership.userId),
      );

      if (currentRequestId !== this.userSearchRequestId) {
        return;
      }

      this.projectUserSearchResults = this.workspaceUsers.filter((user) => {
        if (existingUserIds.has(user.id)) {
          return false;
        }

        const searchableText = [user.name, user.surname, user.email, user.id]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedTerm);
      });
    } catch (error: any) {
      if (currentRequestId !== this.userSearchRequestId) {
        return;
      }

      this.projectUserSearchResults = [];
      this.projectUsersErrorMessage =
        error.message || 'Failed to search workspace users.';
    } finally {
      if (currentRequestId === this.userSearchRequestId) {
        this.isSearchingUsers = false;
      }
    }
  }

  private clearProjectUserSearch(): void {
    this.projectUserSearchTerm = '';
    this.projectUserSearchResults = [];
    this.selectedProjectUser = null;
    this.selectedProjectUserRole = ProjectUserRole.CONTRIBUTOR;
    this.isProjectUserSearchOpen = false;
    this.userSearchRequestId += 1;
  }

  private getSearchResultLabel(user: User): string {
    const displayName = this.getDisplayName(user);

    if (displayName === user.email || !user.email) {
      return displayName;
    }

    return `${displayName} · ${user.email}`;
  }

  private async refreshProjectsStore(): Promise<void> {
    const currentUser = this.store.user.user();

    if (!currentUser?.id) {
      return;
    }

    try {
      await this.store.projects.fetchUserProjects(currentUser.id);
    } catch (error) {
      // Keep local UI responsive even if the background refresh fails.
    }
  }
}
