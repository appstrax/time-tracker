import { Router } from '@angular/router';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthStatus, appstraxAuth } from '@appstrax/services/auth';

import { AuthErrorUtil } from '@utils';
import { Store } from '@state';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [FormsModule],
  providers: [AuthErrorUtil],
})
export class LoginPage {
  email = signal('');
  password = signal('');
  
  loading = signal(false);
  error = signal('');

  constructor(
    private router: Router,
    private authError: AuthErrorUtil,
    private store: Store,
  ) {}

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

      if (response.status != AuthStatus.authenticated) {
        throw new Error(response.status);
      }

      // fetch user data
      await this.store.init();
      const user = this.store.user.user();
      const hasCompleteProfile = Boolean(
        user?.name?.trim() && user?.surname?.trim(),
      );

      if (hasCompleteProfile) {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate(['/profile']);
      }
    } catch (error: any) {
      this.error.set(this.authError.getMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  public isFormValid() {
    return this.email() != '' && this.password() != '';
  }
}
