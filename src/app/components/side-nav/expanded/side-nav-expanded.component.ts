import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

interface NavItem {
  title: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-side-nav-expanded',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-nav-expanded.component.html',
  styleUrls: ['./side-nav-expanded.component.scss'],
})
export class SideNavExpandedComponent {
  @Input() navItems: NavItem[] = [];
  @Output() logout = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<void>();
}


