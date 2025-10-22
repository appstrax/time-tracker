import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent {
  items = [
    { id: '1', text: 'Created initial definition' },
    { id: '2', text: 'Added features section' },
    { id: '3', text: 'Updated project description' },
  ];
}


