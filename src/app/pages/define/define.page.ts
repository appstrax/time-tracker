import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';

@Component({
  selector: 'app-define',
  templateUrl: './define.page.html',
  styleUrls: ['./define.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, SideNavComponent],
})
export class DefinePage {
  constructor() {}
}