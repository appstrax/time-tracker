import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';
import { appstraxAuth, User } from '@appstrax/services/auth';
import { AuthErrors } from '@appstrax/services/auth/models/auth_result';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.page.html',
  styleUrls: ['./verify-email.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class VerifyEmailPage {
  errorMessage: string = '';
  isLoading: boolean = false;
  code: string = '';

  constructor(private router: Router) {}

  public async verifyEmail() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please enter the code you received';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user: User = await appstraxAuth.verifyEmailAddress(this.code);
      if (user) this.router.navigate(['/create-organization']);
    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }

  public isFormValid() {
    return this.code != '';
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
