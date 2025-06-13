import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';

@Component({
  selector: 'app-devops',
  templateUrl: './devops.page.html',
  styleUrls: ['./devops.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, SideNavComponent],
})
export class DevopsPage {
  constructor() {}
} 