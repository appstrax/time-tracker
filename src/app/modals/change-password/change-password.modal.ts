import { FormsModule } from '@angular/forms';
import { Component, signal } from '@angular/core';
import { NgbActiveModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { appstraxAuth } from '@appstrax/services/auth';

import {
  AuthErrorUtil,
  isPasswordValid,
  PASSWORD_REQUIREMENTS,
} from '@utils';

@Component({
  standalone: true,
  templateUrl: './change-password.modal.html',
  styleUrl: './change-password.modal.scss',
  imports: [FormsModule, NgbTooltipModule],
  providers: [AuthErrorUtil],
})
export class ChangePasswordModal {
  readonly passwordRequirements = PASSWORD_REQUIREMENTS;

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
      isPasswordValid(this.newPassword()) &&
      this.newPassword() === this.confirmPassword()
    );
  }

  async submit(): Promise<void> {
    if (this.saving()) {
      return;
    }

    if (!this.currentPassword() || !this.newPassword() || !this.confirmPassword()) {
      this.error.set('Please fill in all fields');
      return;
    }

    if (!isPasswordValid(this.newPassword())) {
      this.error.set(
        `New password does not meet requirements: ${PASSWORD_REQUIREMENTS}`,
      );
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
    } catch (error: unknown) {
      this.error.set(this.authError.getMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    if (this.saving()) {
      return;
    }
    this.activeModal.dismiss();
  }
}
