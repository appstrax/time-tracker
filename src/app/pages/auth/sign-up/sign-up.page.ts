import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { User } from '../../../models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class SignupPage {
  user: User = new User();

  constructor(private router: Router) {}

  public async register() {
    console.log('Registering user: ', this.user);
    this.router.navigate(['/create-organization']);
  }
}
