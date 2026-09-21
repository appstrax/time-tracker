import { Router } from '@angular/router';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AuthResult,
  AuthStatus,
  SSO,
  appstraxAuth,
} from '@appstrax/services/auth';

import { AuthErrorUtil, waitForAuthReady } from '@utils';
import { Store } from '@state';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [FormsModule],
  providers: [AuthErrorUtil],
})
export class LoginPage implements OnInit {
  email = signal('');
  password = signal('');
  linkPassword = signal('');

  loading = signal(false);
  googleLoading = signal(false);
  linkLoading = signal(false);
  error = signal('');

  googleEnabled = signal(false);
  linkRequired = signal(false);
  pendingLinkToken = signal<string | undefined>(undefined);

  constructor(
    private router: Router,
    private authError: AuthErrorUtil,
    private store: Store,
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      await waitForAuthReady();

      const ssoError = appstraxAuth.getSsoRedirectError();
      if (ssoError) {
        this.error.set(this.authError.getMessage(ssoError));
      }

      const ssoResult = await appstraxAuth.handleSsoRedirect();
      if (ssoResult) {
        await this.handleAuthResult(ssoResult);
        if (
          ssoResult.status === AuthStatus.authenticated ||
          ssoResult.status === AuthStatus.linkRequired
        ) {
          await this.loadSsoProviders();
          return;
        }
      } else if (await this.reconcilePostSsoAuthState()) {
        await this.loadSsoProviders();
        return;
      }

      await this.loadSsoProviders();
    } catch (err: unknown) {
      this.error.set(this.authError.getMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.isFormValid()) {
      this.error.set('Please enter an email and a password');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const response = await appstraxAuth.login({
        email: this.email(),
        password: this.password(),
      });

      await this.handleAuthResult(response);
    } catch (error: unknown) {
      this.error.set(this.authError.getMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async onGoogleLogin(): Promise<void> {
    this.googleLoading.set(true);
    this.error.set('');

    try {
      await appstraxAuth.loginWith(SSO.google);
    } catch (error: unknown) {
      this.error.set(this.authError.getMessage(error));
      this.googleLoading.set(false);
    }
  }

  async onLinkAccount(): Promise<void> {
    if (!this.linkPassword()) {
      this.error.set('Please enter your password to link your Google account');
      return;
    }

    this.linkLoading.set(true);
    this.error.set('');

    try {
      const response = await appstraxAuth.linkSsoAccount(
        this.linkPassword(),
        this.pendingLinkToken(),
      );
      await this.handleAuthResult(response);
    } catch (error: unknown) {
      this.error.set(this.authError.getMessage(error));
    } finally {
      this.linkLoading.set(false);
    }
  }

  public isFormValid(): boolean {
    return this.email() !== '' && this.password() !== '';
  }

  private async loadSsoProviders(): Promise<void> {
    try {
      const providers = await appstraxAuth.getSsoProviders();
      const google = providers.find((provider) => provider.id === SSO.google);
      this.googleEnabled.set(Boolean(google?.enabled));
    } catch {
      this.googleEnabled.set(false);
    }
  }

  private async reconcilePostSsoAuthState(): Promise<boolean> {
    const status = await appstraxAuth.getAuthStatus();

    if (status === AuthStatus.linkRequired) {
      this.linkRequired.set(true);
      return true;
    }

    if (status === AuthStatus.authenticated) {
      await this.completeSuccessfulLogin();
      return true;
    }

    return false;
  }

  private async handleAuthResult(response: AuthResult): Promise<void> {
    if (response.status === AuthStatus.linkRequired) {
      this.linkRequired.set(true);
      this.pendingLinkToken.set(response.pendingLinkToken);
      return;
    }

    if (response.status === AuthStatus.pendingTwoFactorAuthCode) {
      throw new Error(AuthStatus.pendingTwoFactorAuthCode);
    }

    if (response.status !== AuthStatus.authenticated) {
      throw new Error(response.status);
    }

    await this.completeSuccessfulLogin();
  }

  private async completeSuccessfulLogin(): Promise<void> {
    this.linkRequired.set(false);
    this.pendingLinkToken.set(undefined);

    await this.store.init();
    const user = this.store.user.user();
    const hasCompleteProfile = Boolean(
      user?.name?.trim() && user?.surname?.trim(),
    );

    await this.router.navigate([hasCompleteProfile ? '/home' : '/profile']);
  }
}
