import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-filter-block',
  standalone: true,
  imports: [],
  templateUrl: './filter-block.component.html',
  styleUrl: './filter-block.component.scss',
})
export class FilterBlockComponent {
  @Input() label: string = '';
  @Input() hint?: string;
}

