import { Injectable } from '@angular/core';
import { AuthErrors } from '@appstrax/services/auth';

@Injectable()
export class AuthErrorUtil {
  public getMessage(err: any): string {
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

  private getMessageFromError(err: any): string {
    if (typeof err === 'string') return err;
    if (err?.error && typeof err.error === 'string') return err.error;
    if (err?.error?.message) return err.error.message;
    if (err?.error?.error?.message) return err.error.error.message;
    if (err?.message) return err.message;
    return 'Something went wrong, please try again later';
  }
}
