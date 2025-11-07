import { Store } from '@state';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, Input, OnInit, Signal, ViewChild, ElementRef } from '@angular/core';

import { Project, TimeSheetEntry } from '@models';
import { ModalCrudOptions } from 'src/app/services/modal.service';

@Component({
  selector: 'app-add-project-user',
  standalone: true,
  templateUrl: './time-sheet-entry-crud.component.html',
  styleUrl: './time-sheet-entry-crud.component.scss',
  imports: [FormsModule, CommonModule]
})
export class TimeSheetEntryCrudComponent implements OnInit {

  @Input() options: TimeSheetEntryCrudOptions = new TimeSheetEntryCrudOptions();

  selectedProject: Project | null = null;

  projects: Signal<Project[]>;

  timeSheetEntry: TimeSheetEntry = new TimeSheetEntry();
  filteredCategories: string[] = [];
  isProjectMenuOpen: boolean = false;
  isCategoryDropdownOpen: boolean = false;
  errorMessage: string = '';

  @ViewChild('hoursTooltip', { static: false }) hoursTooltip!: ElementRef;

  get hoursValue(): number {
    return this.options?.timeSheetEntry?.hours || 0;
  }

  constructor(
    public ngModal: NgbModal,
    private store: Store,
  ) {
    this.projects = this.store.projects.all;
  }

  ngOnInit(): void {
    this.timeSheetEntry = this.options.timeSheetEntry.clone();
    if (this.options.timeSheetEntry.projectId) {
      this.selectedProject = this.projects().find(project => project.id === this.options.timeSheetEntry.projectId) ?? null;
    }
    this.filteredCategories = [...this.options.availableCategories];
  }

  formatHours(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    let formattedMinutes = `${minutes}m`;
    if (minutes < 10) formattedMinutes = '0' + formattedMinutes;
    let formattedHours = `${wholeHours}h`;


    return `${formattedHours} ${formattedMinutes}`;
  }

  toggleProjectMenu(): void {
    this.isProjectMenuOpen = !this.isProjectMenuOpen;
  }

  selectProject(project: Project): void {
    this.selectedProject = project;
    this.isProjectMenuOpen = false;
  }

  onCategoryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toLowerCase().trim();

    if (value === '') {
      this.filteredCategories = [...this.options.availableCategories];
      this.isCategoryDropdownOpen = false;
    } else {
      this.filteredCategories = this.options.availableCategories.filter(cat =>
        cat.toLowerCase().includes(value)
      );
      this.isCategoryDropdownOpen = this.filteredCategories.length > 0;
    }
  }

  selectCategory(category: string): void {
    this.timeSheetEntry.category = category;
    this.isCategoryDropdownOpen = false;
    this.filteredCategories = [...this.options.availableCategories];
  }

  onCategoryFocus(): void {
    if (this.timeSheetEntry.category) {
      const value = this.timeSheetEntry.category.toLowerCase().trim();
      this.filteredCategories = this.options.availableCategories.filter(cat =>
        cat.toLowerCase().includes(value)
      );
    } else {
      this.filteredCategories = [...this.options.availableCategories];
    }
    if (this.filteredCategories.length > 0) {
      this.isCategoryDropdownOpen = true;
    }
  }

  onCategoryBlur(): void {
    setTimeout(() => {
      this.isCategoryDropdownOpen = false;
    }, 200);
  }

  onSaveTimeSheetEntry(): void {
    this.errorMessage = '';
    try {
      if (!this.isFormValid()) {
        return;
      }
      if (!this?.timeSheetEntry) {
        this.errorMessage = 'Invalid time sheet entry';
        return;
      }
      if (this.selectedProject) {
        this.timeSheetEntry.projectId = this.selectedProject.id!;
      }
      this.options.timeSheetEntry.update(this.timeSheetEntry);
      this.options.onSave(this.options.timeSheetEntry);
      this.ngModal.dismissAll();
    } catch (error) {
      this.errorMessage = 'Error saving time sheet entry';
    }

  }

  close(): void {
    this.ngModal.dismissAll();
  }

  isFormValid(): boolean {
    let isValid =this.selectedProject != null &&
      this.timeSheetEntry.hours > 0 &&
      this.timeSheetEntry.description != '' &&
      this.timeSheetEntry.category != '';
    if(isValid) return true;
    let errorMessage = 'Please fill in all required fields';
    if (this.selectedProject == null) errorMessage += '\n\t• Please select a project';
    if (this.timeSheetEntry.category == '') errorMessage += '\n\t• Category is required';
    if (this.timeSheetEntry.hours <= 0) errorMessage += '\n\t• Hours must be greater than 0';
    if (this.timeSheetEntry.description == '') errorMessage += '\n\t• Description is required';
    this.errorMessage = errorMessage;
    return false;
  }
}

export class TimeSheetEntryCrudOptions extends ModalCrudOptions<TimeSheetEntry> {
  timeSheetEntry!: TimeSheetEntry;
  availableCategories: string[] = [];
}
