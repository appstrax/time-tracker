import { FormsModule } from '@angular/forms';
import { Component, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { appstraxAuth } from '@appstrax/services/auth';

import { AuthErrorUtil } from '@utils';

@Component({
  standalone: true,
  templateUrl: './change-password.modal.html',
  styleUrl: './change-password.modal.scss',
  imports: [FormsModule],
  providers: [AuthErrorUtil],
})
export class ChangePasswordModal {
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');

  readonly saving = signal(false);
  readonly error = signal('');

  constructor(
    public activeModal: NgbActiveModal,
    private authError: AuthErrorUtil,
  ) {}

  isFormValid(): boolean {
    return !!(
      this.currentPassword() &&
      this.newPassword() &&
      this.newPassword() === this.confirmPassword()
    );
  }

  async submit(): Promise<void> {
    if (!this.currentPassword() || !this.newPassword() || !this.confirmPassword()) {
      this.error.set('Please fill in all fields');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('New passwords do not match');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    try {
      await appstraxAuth.changePassword({
        password: this.currentPassword(),
        newPassword: this.newPassword(),
      });
      this.activeModal.close();
    } catch (error: any) {
      this.error.set(this.authError.getMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    this.activeModal.dismiss();
  }
}
