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
}
