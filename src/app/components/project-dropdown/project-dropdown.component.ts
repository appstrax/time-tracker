import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Project } from '@models';
import { Store } from '@state';

@Component({
  selector: 'app-project-dropdown',
  imports: [FormsModule, CommonModule],
  templateUrl: './project-dropdown.component.html',
  styleUrl: './project-dropdown.component.scss',
})
export class ProjectDropdownComponent {
  @Input() selectedProject?: Project | null;
  @Input() disabled: boolean = false;
  @Input() allowNull: boolean = false;

  @Output() projectSelected = new EventEmitter<Project | null>();

  projects = computed(() => this.store.projects.projects());
  isProjectDropdownOpen: boolean = false;

  constructor(private store: Store) {}

  onProjectSelected(project: Project | null): void {
    this.selectedProject = project;
    this.projectSelected.emit(project);
    this.isProjectDropdownOpen = false;
  }

  toggleProjectDropdown(): void {
    if (!this.disabled) {
      this.isProjectDropdownOpen = !this.isProjectDropdownOpen;
    }
  }
}
