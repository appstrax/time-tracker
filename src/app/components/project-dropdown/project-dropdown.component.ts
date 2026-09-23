import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
  ViewChild,
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
  @Input() nullOptionLabel = 'Select a project';
  @Input() compact: boolean = false;

  @Output() projectSelected = new EventEmitter<Project | null>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  projects = computed(() => this.store.projects.projects());
  projectSearchTerm = signal('');
  filteredProjects = computed(() => {
    const term = this.projectSearchTerm().trim().toLowerCase();
    const all = this.projects();
    if (!term) {
      return all;
    }
    return all.filter((project) =>
      project.name.toLowerCase().includes(term),
    );
  });

  isProjectDropdownOpen: boolean = false;

  constructor(
    private store: Store,
    private elementRef: ElementRef<HTMLElement>,
  ) {}

  shouldShowNullOption(): boolean {
    if (!this.allowNull) {
      return false;
    }
    const term = this.projectSearchTerm().trim().toLowerCase();
    if (!term) {
      return true;
    }
    return this.nullOptionLabel.toLowerCase().includes(term);
  }

  showEmptyListState(): boolean {
    return (
      this.filteredProjects().length === 0 && !this.shouldShowNullOption()
    );
  }

  emptyListMessage(): string {
    const hasSearch = this.projectSearchTerm().trim().length > 0;
    if (!hasSearch && this.projects().length === 0) {
      return 'No projects available';
    }
    return 'No projects match your search';
  }

  onSearchEscape(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.closeDropdown();
  }

  onProjectSelected(project: Project | null): void {
    this.selectedProject = project;
    this.projectSelected.emit(project);
    this.closeDropdown();
  }

  toggleProjectDropdown(event: Event): void {
    event.stopPropagation();
    if (this.disabled) {
      return;
    }
    if (this.isProjectDropdownOpen) {
      this.closeDropdown();
      return;
    }
    this.isProjectDropdownOpen = true;
    this.projectSearchTerm.set('');
    queueMicrotask(() => this.searchInput?.nativeElement.focus());
  }

  closeDropdown(): void {
    this.isProjectDropdownOpen = false;
    this.projectSearchTerm.set('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isProjectDropdownOpen) {
      return;
    }
    const target = event.target;
    if (target instanceof Node && this.elementRef.nativeElement.contains(target)) {
      return;
    }
    this.closeDropdown();
  }
}
