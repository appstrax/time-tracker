import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { User } from '../../../models/user.model';
import { Router } from '@angular/router';
import {
  AuthErrors,
  AuthResult,
  AuthStatus,
} from '@appstrax/services/auth/models/auth_result';
import { appstraxAuth } from '@appstrax/services/auth';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class SignupPage {
  user: User = new User();
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private router: Router) {}

  public async register() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please enter all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const result: AuthResult = await appstraxAuth.register({
        email: this.user.email,
        password: this.user.password,
        data: {
          name: this.user.name,
          surname: this.user.surname,
          profilePictureUrl: '',
          cvPdfUrl: '',
          linkedinUrl: '',
          githubUrl: '',
          twitterUrl: '',
          facebookUrl: '',
          instagramUrl: '',
          youtubeUrl: '',
          tiktokUrl: '',
        },
      });
      if (result.status == AuthStatus.authenticated) {
        await appstraxAuth.sendEmailVerificationCode();
        this.router.navigate(['/verify-email']);
      }
    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }

  public isFormValid() {
    return (
      this.user.name != '' &&
      this.user.surname != '' &&
      this.user.email != '' &&
      this.user.password != ''
    );
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
