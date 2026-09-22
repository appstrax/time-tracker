import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Component, computed, inject, signal } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { appstraxAuth } from '@appstrax/services/auth';
import { appstraxStorage } from '@appstrax/services/storage';

import { User } from '@models';
import { ChangePasswordModal } from '@modals';
import { ToastService } from '@services';
import { Store } from '@state';
import { getUserInitials } from '@utils';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [RouterModule, FormsModule],
})
export class ProfilePage {
  public user = signal(new User());
  public name = signal('');
  public surname = signal('');

  public saving = signal(false);
  public editing = signal(false);

  projects = computed(() => this.store.projects.projects());
  userInitials = computed(() => getUserInitials(this.user()));

  private readonly modalService = inject(NgbModal);

  constructor(
    private store: Store,
    private toast: ToastService,
  ) {}

  public async ngOnInit(): Promise<void> {
    try {
      const authUser = await appstraxAuth.getUser();
      if (authUser) {
        const user = User.fromAuthUser(authUser);
        this.user.set(user);
        this.resetEditingValues();
      }
    } catch (err) {
      console.error('Failed to load user/profile data', err);
    }
  }

  private resetEditingValues(): void {
    const user = this.user();
    this.name.set(user.name);
    this.surname.set(user.surname);
  }

  onUploadProfilePicture(): void {
    const input = document.querySelector(
      'input[type="file"][accept^="image/"]',
    ) as HTMLInputElement | null;
    input?.click();
  }

  async onProfilePictureSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    let file = target.files[0];

    file = new File([file], `${this.user().id}_${file.name}`, {
      type: file.type,
    });

    try {
      const response = await appstraxStorage.uploadFile(
        file,
        'user_profile_pictures',
      );

      this.user.update((user) =>
        Object.assign(new User(), user, {
          profilePictureUrl: response.downloadUrl,
        }),
      );

      await this.updateUser();
    } catch (err) {
      console.error('Profile picture upload failed', err);
    } finally {
      target.value = '';
    }
  }

  async updateUser() {
    this.saving.set(true);
    const user = this.user();
    const name = this.name();
    const surname = this.surname();

    try {
      await appstraxAuth.saveUserData({
        name,
        surname,
        profilePictureUrl: user.profilePictureUrl,
      });

      this.user.update((currentUser) =>
        Object.assign(new User(), currentUser, {
          name,
          surname,
        }),
      );
      this.resetEditingValues();
      this.editing.set(false);
      this.toast.success('User updated successfully', 'Success');
    } catch (err) {
      this.toast.error('Failed to save', 'Error');
    } finally {
      this.saving.set(false);
    }
  }

  toggleEditing() {
    if (this.editing()) {
      this.resetEditingValues();
      this.editing.set(false);
      return;
    }

    this.resetEditingValues();
    this.editing.set(true);
  }

  openChangePasswordModal(): void {
    const modal = this.modalService.open(ChangePasswordModal, { centered: true });
    modal.result.then(
      () => this.toast.success('Password updated successfully', 'Success'),
      () => {},
    );
  }
}
