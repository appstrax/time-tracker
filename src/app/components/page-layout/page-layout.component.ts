import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SideNavComponent, ToastContainerComponent } from '@components';

@Component({
  templateUrl: './page-layout.component.html',
  styleUrls: ['./page-layout.component.scss'],
  standalone: true,
  imports: [RouterModule, SideNavComponent, ToastContainerComponent],
})
export class PageLayoutComponent {}
