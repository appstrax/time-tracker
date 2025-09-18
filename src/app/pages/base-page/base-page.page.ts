import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';
import { ProjectSelectorComponent } from '../../components/project-selector/project-selector.component';

@Component({
  selector: 'app-base-page',
  templateUrl: './base-page.page.html',
  styleUrls: ['./base-page.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, SideNavComponent, ProjectSelectorComponent]
})
export class BasePage {}


