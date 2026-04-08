import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { appstraxAuth } from '@appstrax/services/auth';

@Component({
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class LandingPage implements OnInit {
  constructor(private router: Router) {}

  async ngOnInit(): Promise<void> {
    const isAuthenticated = await appstraxAuth.isAuthenticated();
    await this.router.navigate([isAuthenticated ? '/home' : '/login']);
  }
}
