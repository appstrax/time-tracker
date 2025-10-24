import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Store } from '@state';
import { SideNavComponent } from '@components';
import { HeaderComponent } from '@components';
import { ToastContainerComponent } from '../../components/toast-container/toast-container.component';

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
    ToastContainerComponent,
  ],
})
export class BasePage {
  constructor(private store: Store) {
    this.store.init();
  }
}
