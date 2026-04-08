import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { appstraxAuth } from '@appstrax/services/auth';

import { AuthErrorUtil } from '@utils';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  providers: [AuthErrorUtil],
})
export class ForgotPasswordPage {
  readonly error = signal('');
  readonly loading = signal(false);
  readonly showResetPassword = signal(false);

  readonly email = signal('');
  readonly code = signal('');
  readonly password = signal('');

  constructor(
    private router: Router,
    private authError: AuthErrorUtil,
  ) {}

  public async sendEmail() {
    if (!this.isSendEmailFormValid()) {
      this.error.set('Please enter your email');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const email = this.email();
      const response = await appstraxAuth.forgotPassword({ email });
      if (response) {
        this.showResetPassword.set(true);
      }
    } catch (error: any) {
      this.error.set(this.authError.getMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  public isSendEmailFormValid() {
    return !!this.email();
  }

  public async resetPassword() {
    if (!this.isResetPasswordFormValid()) {
      this.error.set('Please enter your email, code and password');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const response = await appstraxAuth.resetPassword({
        email: this.email(),
        code: this.code(),
        password: this.password(),
      });
      if (response) {
        this.router.navigate(['/login']);
      }
    } catch (error: any) {
      this.error.set(this.authError.getMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  public isResetPasswordFormValid() {
    return !!(this.email() && this.code() && this.password());
  }
}
