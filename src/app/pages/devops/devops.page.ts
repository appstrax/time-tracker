import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-devops',
  templateUrl: './devops.page.html',
  styleUrls: ['./devops.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class DevopsPage {
  constructor() {}
} 