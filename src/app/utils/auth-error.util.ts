import { Injectable } from '@angular/core';
import { AuthErrors, AuthStatus } from '@appstrax/services/auth';

const GENERIC_SIGN_IN_FAILURE =
  'Something went wrong while signing in. Please try again, or contact support if the problem continues.';

@Injectable()
export class AuthErrorUtil {
  public getMessage(err: unknown): string {
    const message = this.getMessageFromError(err);
    return this.resolveMessage(message);
  }

  private resolveMessage(message: string): string {
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
      case AuthErrors.invalidResetCode:
        return 'Invalid Reset Code';
      case AuthErrors.tooManyAttempts:
      case 'tooManyAttempts':
        return 'Too many login attempts. Please wait a few minutes and try again.';
      case AuthErrors.tooManyRequests:
      case 'tooManyRequests':
        return 'Too many requests. Please try again later.';
      case AuthErrors.unexpectedError:
        return 'Unexpected error';
      case 'sso_account_domain_not_allowed':
        return (
          'This Google account is not allowed for this app. Sign in with your work Google account, ' +
          'or ask your administrator if you need access.'
        );
      case 'ssoRequired':
        return 'This account must sign in with Google. Use Continue with Google below.';
      case 'access_denied':
        return 'Google sign-in was cancelled. Try again, or sign in with email and password if your account allows it.';
      case 'oauth_failed':
        return 'Google sign-in could not be completed. Please try again.';
      case 'Invalid SSO redirect':
        return 'Google sign-in could not be completed. Please start sign-in again from this page.';
      case 'Missing SSO link token':
        return (
          'Linking your Google account timed out. Start Google sign-in again and enter your password when prompted.'
        );
      case 'SSO popup closed':
        return 'Google sign-in was cancelled.';
      case 'Unable to open SSO popup':
        return 'Could not open the Google sign-in window. Allow pop-ups for this site and try again.';
      case AuthStatus.pendingTwoFactorAuthCode:
        return 'Enter the code from your authenticator app to continue.';
      default:
        if (this.isMachineErrorCode(message)) {
          return GENERIC_SIGN_IN_FAILURE;
        }
        return message;
    }
  }

  private isMachineErrorCode(message: string): boolean {
    if (!message || message.length > 120 || message.includes(' ')) {
      return false;
    }
    return /^[a-z][a-z0-9_]*$/.test(message) || /^[a-z]+([A-Z][a-z0-9]*)+$/.test(message);
  }

  private getMessageFromError(err: unknown): string {
    if (typeof err === 'string') return err;
    const anyErr = err as {
      error?: string | { message?: string; error?: { message?: string } };
      message?: string;
    };
    if (anyErr?.error && typeof anyErr.error === 'string') return anyErr.error;
    if (anyErr?.error && typeof anyErr.error === 'object' && anyErr.error.message) {
      return anyErr.error.message;
    }
    if (anyErr?.error && typeof anyErr.error === 'object' && anyErr.error.error?.message) {
      return anyErr.error.error.message;
    }
    if (anyErr?.message) return anyErr.message;
    return 'Something went wrong, please try again later';
  }
}
