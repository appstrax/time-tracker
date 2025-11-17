import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '@models';

@Component({
  selector: 'app-projects-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects-block.component.html',
  styleUrl: './projects-block.component.scss'
})
export class ProjectsBlockComponent {
  @Input() project: Project | null = null; // null = "All Projects"
  @Input() isSelected: boolean = false;
  @Input() isAllProjects: boolean = false;

  @Output() projectSelected = new EventEmitter<Project | null>();

  onBlockClick(): void {
    this.projectSelected.emit(this.project);
  }

  getDisplayName(): string {
    if (this.isAllProjects) {
      return 'All Projects';
    }
    return this.project?.name || 'Unknown Project';
  }
}

