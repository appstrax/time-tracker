import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { isAuthenticatedAfterReady } from '@utils';

@Component({
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class LandingPage implements OnInit {
  constructor(private router: Router) {}

  async ngOnInit(): Promise<void> {
    const isAuthenticated = await isAuthenticatedAfterReady();
    if (isAuthenticated) {
      await this.router.navigate(['/home']);
      return;
    }

    await this.router.navigate(['/login'], {
      queryParamsHandling: 'preserve',
    });
  }
}
