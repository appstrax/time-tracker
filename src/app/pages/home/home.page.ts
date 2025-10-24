import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ToastService } from '@services';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class HomePage {
  constructor(private toast: ToastService) {
    this.toast.success('Hello, world!');
  }
} 