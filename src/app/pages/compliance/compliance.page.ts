import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-compliance',
  templateUrl: './compliance.page.html',
  styleUrls: ['./compliance.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class CompliancePage {
  constructor() {}
} 