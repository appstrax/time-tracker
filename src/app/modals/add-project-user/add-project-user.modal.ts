import { Component, Input, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ProjectUserRole, User } from '@models';
import { getUserDisplayName, getUserInitials } from '@utils';

export interface AddProjectUserResult {
  user: User;
  role: ProjectUserRole;
}

@Component({
  standalone: true,
  templateUrl: './add-project-user.modal.html',
  styleUrl: './add-project-user.modal.scss',
  imports: [FormsModule],
})
export class AddProjectUserModal {
  @Input() users: User[] = [];

  readonly userRoles = signal<ProjectUserRole[]>(
    Object.values(ProjectUserRole),
  );
  readonly searchTerm = signal('');
  readonly selectedUser = signal<User | null>(null);
  readonly role = signal(ProjectUserRole.CONTRIBUTOR);
  readonly isSearchOpen = signal(false);

  readonly searchResults = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    return this.users.filter((user) => {
      const searchableText = [user.name, user.surname, user.email, user.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(term);
    });
  });

  constructor(public activeModal: NgbActiveModal) {}

  public onSearchFocus(): void {
    this.isSearchOpen.set(true);
  }

  public onSearchBlur(): void {
    setTimeout(() => this.isSearchOpen.set(false), 150);
  }

  public onSearchTermChange(term: string): void {
    this.searchTerm.set(term);
    this.isSearchOpen.set(true);
  }

  public onUserSelect(user: User): void {
    this.selectedUser.set(user);
    this.searchTerm.set('');
    this.isSearchOpen.set(false);
  }

  public clearSelectedUser(): void {
    this.selectedUser.set(null);
  }

  public onAddClick(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.activeModal.close({ user, role: this.role() });
  }

  public close(): void {
    this.activeModal.dismiss();
  }

  public getDisplayName(user: User | null): string {
    return getUserDisplayName(user);
  }

  public getUserSecondaryText(user: User | null): string {
    if (!user) return 'No email available';
    return user.email || user.id;
  }

  public getUserInitials(user: User | null): string {
    return getUserInitials(user);
  }

  public formatRole(role: ProjectUserRole): string {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }
}
