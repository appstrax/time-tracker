import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Project } from '@models';
import { Store } from '@state';

@Component({
  selector: 'app-project-dropdown',
  imports: [FormsModule, CommonModule],
  templateUrl: './project-dropdown.component.html',
  styleUrl: './project-dropdown.component.scss'
})
export class ProjectDropdownComponent {

  @Input() selectedProject?: Project;
  @Output() projectSelected = new EventEmitter<Project>();

  isProjectDropdownOpen: boolean = false;

  projects: Signal<Project[]>;

  constructor(private store: Store) {
    this.projects = this.store.projects.all;
  }

  onProjectSelected(project: Project): void {
    this.selectedProject = project;
    this.projectSelected.emit(project);
    this.isProjectDropdownOpen = false;
  }

  toggleProjectDropdown(): void {
    this.isProjectDropdownOpen = !this.isProjectDropdownOpen;
  }

}
