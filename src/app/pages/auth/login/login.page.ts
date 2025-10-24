import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { UserService } from '@services';
import { User, AuthErrors } from '@appstrax/services/auth';
import { AuthStatus, appstraxAuth } from '@appstrax/services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class LoginPage {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  isLoading: boolean = false;
  hasProject: boolean = false;
  hasOrganization: boolean = false;

  constructor(private router: Router, private userService: UserService) {}

  async onSubmit(): Promise<void> {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please enter both email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await appstraxAuth.login({
        email: this.email,
        password: this.password,
      });

      const user: User = await appstraxAuth.getUser();
      this.hasProject = await this.userService.hasProject(user.id);
      this.hasOrganization = await this.userService.hasOrganization(user.id);

      if (
        response.status == AuthStatus.authenticated &&
        this.hasOrganization &&
        this.hasProject
      ) {
        this.router.navigate(['/home']);
      } else if (!this.hasOrganization) {
        this.router.navigate(['/create-organization']);
      } else if (this.hasProject) {
        this.router.navigate(['/create-project']);
      }
    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }

  public isFormValid() {
    return this.email != '' && this.password != '';
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
