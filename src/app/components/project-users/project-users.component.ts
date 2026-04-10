import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ConfirmModalComponent } from '@modals';
import { Project, ProjectUser, ProjectUserRole, User } from '@models';
import { getUserDisplayName } from '@utils';
import { ProjectUserService, ToastService, UsersService } from '@services';
import { Store } from '@state';

interface Member {
  projectUser: ProjectUser;
  user: User | null;
}

@Component({
  selector: 'app-project-users',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './project-users.component.html',
  styleUrls: ['./project-users.component.scss'],
})
export class ProjectUsersComponent implements OnInit {
  @Input() project: Project = new Project();
  @Output() projectChange = new EventEmitter<Project>();

  private users: User[] = [];

  readonly loading = signal(false);
  readonly error = signal('');
  readonly saving = signal('');

  readonly members = signal<Member[]>([]);
  readonly memberCount = computed(() => this.members().length);
  readonly userRoles = signal<ProjectUserRole[]>(
    Object.values(ProjectUserRole),
  );
  readonly searchTerm = signal('');
  readonly searchResults = signal<User[]>([]);
  readonly selectedUser = signal<User | null>(null);
  readonly selectedUserRole = signal(ProjectUserRole.CONTRIBUTOR);
  readonly isSearchOpen = signal(false);

  constructor(
    private store: Store,
    private toast: ToastService,
    private projectUserService: ProjectUserService,
    private usersService: UsersService,
    private modalService: NgbModal,
  ) {}

  ngOnInit(): void {
    this.fetchProjectUsers(this.project.id);
  }

  private async fetchProjectUsers(projectId: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.members.set([]);
    this.clearSearch();

    try {
      this.users = await this.usersService.fetchUsers();

      const projectUsers =
        await this.projectUserService.findByProjectId(projectId);
      const users = await this.resolveUsers(projectUsers);

      this.members.set(this.buildMembers(projectUsers, users));
      this.emitProjectUsers();
    } catch (error: any) {
      this.error.set(error.message || 'Failed to load project users.');
    } finally {
      if (this.project.id === projectId) {
        this.loading.set(false);
      }
    }
  }

  private async resolveUsers(projectUsers: ProjectUser[]): Promise<User[]> {
    const userIds = [
      ...new Set(projectUsers.map((projectUser) => projectUser.userId)),
    ];
    if (!userIds.length) return [];

    const users = this.users.filter((user) => userIds.includes(user.id));
    if (users.length === userIds.length) return users;

    return this.usersService.findByUserIds(userIds);
  }

  private buildMembers(projectUsers: ProjectUser[], users: User[]): Member[] {
    const usersById = new Map(users.map((user) => [user.id, user]));

    return this.sortMembers(
      projectUsers.map((projectUser) => ({
        projectUser,
        user: usersById.get(projectUser.userId) ?? null,
      })),
    );
  }

  private sortMembers(members: Member[]): Member[] {
    const name = this.getDisplayName;
    return members.sort((a, b) => name(a.user).localeCompare(name(b.user)));
  }

  public async onAddUserClick(): Promise<void> {
    const user = this.selectedUser();

    if (!this.project.id || !user) return;

    if (this.members().some((x) => x.projectUser.userId === user.id)) {
      this.error.set('This user already belongs to the project.');
      return;
    }

    this.saving.set(user.id);
    this.error.set('');

    try {
      const projectUser = new ProjectUser();
      projectUser.projectId = this.project.id;
      projectUser.userId = user.id;
      projectUser.role = this.selectedUserRole();
      const savedProjectUser = await this.projectUserService.save(projectUser);

      this.members.set(
        this.sortMembers([
          ...this.members(),
          {
            projectUser: savedProjectUser,
            user: user,
          },
        ]),
      );

      this.emitProjectUsers();
      this.clearSearch();
      this.refreshProjectsStore();
      this.toast.success('Project user added', 'Success');
    } catch (error: any) {
      this.error.set(error.message || 'Failed to add project user.');
      this.toast.error(this.error(), 'Error');
    } finally {
      this.saving.set('');
    }
  }

  public onUserSelect(user: User): void {
    this.selectedUser.set(user);
    this.searchTerm.set(this.getSearchResultLabel(user));
    this.isSearchOpen.set(false);
  }

  public async updateProjectUserRole(
    member: Member,
    nextRole: ProjectUserRole,
  ): Promise<void> {
    if (member.projectUser.role === nextRole) {
      return;
    }

    const previousRole = member.projectUser.role;
    member.projectUser.role = nextRole;
    this.error.set('');

    try {
      member.projectUser = await this.projectUserService.save(
        member.projectUser,
      );
      this.members.set(this.sortMembers([...this.members()]));
      await this.refreshProjectsStore();
      this.toast.success('Project role updated', 'Success');
    } catch (error: any) {
      member.projectUser.role = previousRole;
      this.error.set(error.message || 'Failed to update the project role.');
      this.toast.error(this.error(), 'Error');
    }
  }

  public async onRemoveUserClick(member: Member): Promise<void> {
    const modal = this.modalService.open(ConfirmModalComponent);
    modal.componentInstance.title = 'Remove User';
    modal.componentInstance.headerClass = 'bg-danger';
    modal.componentInstance.confirmButtonClass = 'btn-danger';
    modal.componentInstance.message = `Are you sure you want to remove ${this.getDisplayName(member.user)} from this project?`;
    modal.componentInstance.confirmButtonText = 'Remove';
    modal.componentInstance.onConfirm = () => this.removeMember(member);
  }

  private async removeMember(member: Member): Promise<void> {
    this.error.set('');
    this.saving.set(member.projectUser.userId);

    try {
      await this.projectUserService.delete(member.projectUser.id);
      this.members.set(
        this.members().filter(
          (currentMember) =>
            currentMember.projectUser.id !== member.projectUser.id,
        ),
      );
      this.emitProjectUsers();
      await this.refreshProjectsStore();
      this.toast.success('Project user removed', 'Success');
    } catch (error: any) {
      this.error.set(error.message || 'Failed to remove the project user.');
      this.toast.error(this.error(), 'Error');
    } finally {
      this.saving.set('');
    }
  }

  public isMemberBusy(member: Member): boolean {
    return this.saving() === member.projectUser.userId;
  }

  public onSearchFocus(): void {
    this.isSearchOpen.set(true);
    this.searchProjectUsers();
  }

  public onSearchBlur(): void {
    setTimeout(() => this.isSearchOpen.set(false), 150);
  }

  public onSearchTermChange(term: string): void {
    this.searchTerm.set(term);
    this.searchProjectUsers();
  }

  private searchProjectUsers(): void {
    const term = this.searchTerm().trim().toLowerCase();
    this.error.set('');
    this.isSearchOpen.set(true);

    const existingUserIds = new Set(
      this.members().map((member) => member.projectUser.userId),
    );

    this.searchResults.set(
      this.users.filter((user) => {
        if (existingUserIds.has(user.id)) return false;

        const searchableText = [user.name, user.surname, user.email, user.id]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(term);
      }),
    );
  }

  public getDisplayName(user: User | null): string {
    return getUserDisplayName(user);
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

  private emitProjectUsers(): void {
    const project = Object.assign(new Project(), this.project, {
      users: this.members().map((x) => x.user),
    });

    this.projectChange.emit(project);
  }

  private clearSearch(): void {
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.selectedUser.set(null);
    this.selectedUserRole.set(ProjectUserRole.CONTRIBUTOR);
    this.isSearchOpen.set(false);
  }

  private getSearchResultLabel(user: User): string {
    const displayName = this.getDisplayName(user);

    if (displayName === user.email || !user.email) {
      return displayName;
    }

    return `${displayName} · ${user.email}`;
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
}
