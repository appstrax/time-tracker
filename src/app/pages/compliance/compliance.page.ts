import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';

@Component({
  selector: 'app-compliance',
  templateUrl: './compliance.page.html',
  styleUrls: ['./compliance.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, SideNavComponent],
})
export class CompliancePage {
  constructor() {}
} 