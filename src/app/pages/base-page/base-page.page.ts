import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Store } from '@state';
import { SideNavComponent } from '@components';
import { ProjectSelectorComponent } from '@components';

@Component({
  selector: 'app-base-page',
  templateUrl: './base-page.page.html',
  styleUrls: ['./base-page.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SideNavComponent,
    ProjectSelectorComponent,
  ],
})
export class BasePage {
  constructor(private store: Store) {
    this.store.init();
  }
}
