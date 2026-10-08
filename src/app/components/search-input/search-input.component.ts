import { Component, input, model } from '@angular/core';

/** Themed search field with a clear button; two-way bind with `[(value)]`. */
@Component({
  selector: 'app-search-input',
  standalone: true,
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent {
  public readonly value = model('');
  public readonly placeholder = input('Search…');
  public readonly ariaLabel = input('Search');

  public onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  public clear(): void {
    this.value.set('');
  }
}
