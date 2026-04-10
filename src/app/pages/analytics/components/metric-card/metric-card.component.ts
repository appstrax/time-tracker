import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.scss',
})
export class MetricCardComponent {
  public readonly label = input('');
  public readonly value = input<string | number>('');
  public readonly valueSuffix = input('');
  public readonly iconClass = input('bi bi-circle');
}

