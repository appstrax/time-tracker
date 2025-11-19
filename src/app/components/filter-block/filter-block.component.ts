import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-block.component.html',
  styleUrl: './filter-block.component.scss',
})
export class FilterBlockComponent {
  @Input() label: string = '';
  @Input() hint?: string;
}

