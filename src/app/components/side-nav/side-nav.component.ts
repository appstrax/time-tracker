import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class SideNavComponent {
  isVisible = false;

  @HostListener('document:mousemove', ['$event']) 
  onMouseMove(event: MouseEvent) {
    const threshold = 50; // pixels from left edge to trigger
    this.isVisible = event.clientX <= threshold;
  }
}
