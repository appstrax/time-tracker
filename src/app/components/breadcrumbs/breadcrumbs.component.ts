import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

import { BreadcrumbService, IBreadcrumb } from '@services';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
})
export class BreadcrumbsComponent implements OnInit {
  breadcrumbs: IBreadcrumb[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private breadcrumbService: BreadcrumbService) {}

  ngOnInit(): void {
    this.subscription = this.breadcrumbService.subscribe((breadcrumbs) => {
      this.breadcrumbs = breadcrumbs;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
