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

import {
  AddProjectUserModal,
  AddProjectUserResult,
  ConfirmModalComponent,
} from '@modals';
import { Project, ProjectUser, ProjectUserRole, User } from '@models';
import { getUserDisplayName, getUserInitials } from '@utils';
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
  readonly addingUser = signal(false);

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
    if (!this.project.id) return;

    const modalRef = this.modalService.open(AddProjectUserModal, {
      centered: true,
    });
    modalRef.componentInstance.users = this.availableUsers();

    let result: AddProjectUserResult;

    try {
      result = await modalRef.result;
    } catch {
      return;
    }

    if (!result?.user) return;

    await this.addProjectUser(result.user, result.role);
  }

  private availableUsers(): User[] {
    const memberUserIds = new Set(
      this.members().map((member) => member.projectUser.userId),
    );

    return this.users.filter((user) => !memberUserIds.has(user.id));
  }

  private async addProjectUser(
    user: User,
    role: ProjectUserRole,
  ): Promise<void> {
    this.addingUser.set(true);
    this.error.set('');

    try {
      const projectUser = new ProjectUser();
      projectUser.projectId = this.project.id;
      projectUser.userId = user.id;
      projectUser.role = role;
      const savedProjectUser = await this.projectUserService.save(projectUser);

      this.members.set(
        this.sortMembers([
          ...this.members(),
          { projectUser: savedProjectUser, user },
        ]),
      );

      this.emitProjectUsers();
      await this.refreshProjectsStore();
      this.toast.success('Project user added', 'Success');
    } catch (error: any) {
      this.error.set(error.message || 'Failed to add project user.');
      this.toast.error(this.error(), 'Error');
    } finally {
      this.addingUser.set(false);
    }
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
    return getUserInitials(user);
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
