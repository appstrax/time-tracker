import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-project-preview',
  standalone: true,
  templateUrl: './project-preview.component.html',
  styleUrls: ['./project-preview.component.scss'],
})
export class ProjectPreviewComponent {
  @Input() logoUrl: string | null = '';
  @Input() color = '';
  @Input() name = '';
  @Input() description = '';
  @Input() namePlaceholder = 'Untitled project';
  @Input() descriptionPlaceholder = 'No description provided.';
  /** Tighter sizing for list rows. */
  @Input() compact = false;
  /** Shows a small badge when the project is billable by default. */
  @Input() billable = false;
}
