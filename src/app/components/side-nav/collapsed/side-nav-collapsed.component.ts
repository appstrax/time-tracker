import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, AfterViewInit, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Tooltip } from 'bootstrap';

interface NavItem {
  title: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-side-nav-collapsed',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-nav-collapsed.component.html',
  styleUrls: ['./side-nav-collapsed.component.scss'],
})
export class SideNavCollapsedComponent implements AfterViewInit, OnDestroy {
  @Input() navItems: NavItem[] = [];
  @Output() logout = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<void>();

  private tooltips: Tooltip[] = [];

  ngAfterViewInit() {
    setTimeout(() => {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      this.tooltips = [...tooltipTriggerList].map((tooltipTriggerEl) => {
        return new Tooltip(tooltipTriggerEl, {
          placement: 'right',
          trigger: 'hover focus',
          delay: { show: 300, hide: 100 },
          container: 'body',
          boundary: document.body as any,
        });
      });
    }, 100);
  }

  ngOnDestroy() {
    this.tooltips.forEach((tooltip) => tooltip.dispose());
  }
}


