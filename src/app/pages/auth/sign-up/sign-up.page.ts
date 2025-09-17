import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { appstraxAuth, AuthErrors } from '@appstrax/services/auth';
import { AuthResult } from '@appstrax/services/auth/models/auth_result';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class SignupPage {
  showClientForm: boolean = false;
  showProviderForm: boolean = false;

  constructor(private router: Router) {}

  public onSelectRole(role: 'client' | 'provider') {
    if (role === 'client') {
      this.showClientForm = true;
      this.showProviderForm = false;
    } else {
      this.showClientForm = false;
      this.showProviderForm = true;
    }
  }

  public async register() {
    try {
      const result: AuthResult = await appstraxAuth.register({
        email: '',
        password: '',
        data: {
          'firstName': '',
          'lastName': '',
        }
      });
      console.log('Successfully Registered: ', result.user?.email);
    } catch (err) {
      this.getErrorMessage(err);
    }
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
