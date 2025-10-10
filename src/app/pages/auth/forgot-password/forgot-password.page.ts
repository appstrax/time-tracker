import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Router, RouterModule } from '@angular/router';
import { appstraxAuth, MessageDto } from '@appstrax/services/auth';
import { AuthErrors } from '@appstrax/services/auth/models/auth_result';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class ForgotPasswordPage {
  errorMessage: string = '';
  isLoading: boolean = false;
  showResetPassword: boolean = false;
  email: string = '';
  code: string = '';
  password: string = '';

  constructor(private router: Router) {}

  public async sendEmail() {
    if (!this.isSendEmailFormValid()) {
      this.errorMessage = 'Please enter your email';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response: MessageDto = await appstraxAuth.forgotPassword({ email: this.email });
      if (response) {
        this.showResetPassword = true;
      }
    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }

  public isSendEmailFormValid() {
    return this.email != '';
  }

  public async resetPassword() {
    if (!this.isResetPasswordFormValid()) {
      this.errorMessage = 'Please enter your email, code and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response: MessageDto = await appstraxAuth.resetPassword({ email: this.email, code: this.code, password: this.password });
      if (response) {
        this.router.navigate(['/login']);
      }
    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }

  public isResetPasswordFormValid() {
    return this.email != '' && this.code != '' && this.password != '';
  }

  public getErrorMessage(err: any) {
    const message = this.getMessageFromError(err);
    switch (message) {
      case AuthErrors.emailAddressAlreadyExists:
        return 'Email Address Already Exists';
      case AuthErrors.badlyFormattedEmailAddress:
        return 'Email Address Badly Formatted';
      case AuthErrors.noPasswordSupplied:
        return 'No Password Supplied';
      case AuthErrors.invalidEmailOrPassword:
        return 'Invalid Email Or Password';
      case AuthErrors.userBlocked:
        return 'User blocked, please reset your password';
      case AuthErrors.invalidTwoFactorAuthCode:
        return 'Invalid Two Factor Authentication Code';
      case AuthErrors.emailAddressDoesNotExist:
        return 'Email Address Does Not Exist';
      case AuthErrors.invalidResetCode:
        return 'Invalid Reset Code';
      case AuthErrors.unexpectedError:
        return 'Unexpected error';
      default:
        return message;
    }
  }

  private getMessageFromError(err: any) {
    if (typeof err === 'string') return err;
    if (err.error && typeof err.error === 'string') return err.error;
    if (err.error?.message) return err.error.message;
    if (err.error?.error?.message) return err.error.error.message;
    if (err.message) return err.message;
    return 'Something went wrong, please try again later';
  }
}
