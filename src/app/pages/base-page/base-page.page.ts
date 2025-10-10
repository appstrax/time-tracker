import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Store } from '@state';
import { SideNavComponent } from '@components';
import { HeaderComponent } from '@components';

@Component({
  selector: 'app-base-page',
  templateUrl: './base-page.page.html',
  styleUrls: ['./base-page.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SideNavComponent,
    HeaderComponent,
  ],
})
export class BasePage {
  constructor(private store: Store) {
    this.store.init();
  }
}
