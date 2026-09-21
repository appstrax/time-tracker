import { Component, input } from '@angular/core';


@Component({
  selector: 'app-filter-block',
  standalone: true,
  imports: [],
  templateUrl: './filter-block.component.html',
  styleUrl: './filter-block.component.scss',
})
export class FilterBlockComponent {
  public readonly label = input('');
  public readonly hint = input<string | undefined>(undefined);
}

