import { Store } from '@state';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { appstraxAuth } from '@appstrax/services/auth';
import {
  Component,
  Input,
  OnInit,
  Signal,
  ViewChild,
  ElementRef,
} from '@angular/core';

import { Project, TimeSheetEntry } from '@models';


@Component({
  selector: 'app-add-project-user',
  standalone: true,
  templateUrl: './time-sheet-entry.modal.html',
  styleUrl: './time-sheet-entry.modal.scss',
  imports: [FormsModule, CommonModule],
})
export class TimeSheetEntryCrudComponent implements OnInit {
  @Input() timeSheetEntry = new TimeSheetEntry();
  @Input() categories!: string[];
  @Input() date!: Date;

  projects: Signal<Project[]>;
  
  selectedProject: Project | undefined;
  filteredCategories: string[] = [];
  
  isProjectDropdownOpen: boolean = false;
  isCategoryDropdownOpen: boolean = false;
  
  errorMessage: string = '';
  
  @ViewChild('hoursTooltip', { static: false }) hoursTooltip!: ElementRef;
  
  get hours(): number {
    return this.timeSheetEntry?.hours || 0;
  }
  
  constructor(public activeModal: NgbActiveModal, private store: Store, ) {
    this.projects = this.store.projects.all;
  }
  
  async ngOnInit(): Promise<void> {
    const projectId = this.timeSheetEntry.projectId;
    if (projectId) {
      this.selectedProject = this.projects().find((x) => x.id === projectId);
    }

    this.filteredCategories = [...this.categories];
    
    const user = await appstraxAuth.getUser();
    this.timeSheetEntry.userId = user.id;
    this.timeSheetEntry.date = this.date;
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
    this.isProjectDropdownOpen = !this.isProjectDropdownOpen;
  }

  onProjectSelected(project: Project): void {
    this.selectedProject = project;
    this.isProjectDropdownOpen = false;
    this.timeSheetEntry.projectId = project.id;
  }

  onCategoryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toLowerCase().trim();

    if (value === '') {
      this.filteredCategories = [...this.categories];
      this.isCategoryDropdownOpen = false;
    } else {
      this.filteredCategories = this.categories.filter((category) =>
        category.toLowerCase().includes(value)
      );
      this.isCategoryDropdownOpen = this.filteredCategories.length > 0;
    }
  }

  selectCategory(category: string): void {
    this.timeSheetEntry.category = category;
    this.isCategoryDropdownOpen = false;
    this.filteredCategories = [...this.categories];
  }

  onCategoryFocus(): void {
    if (this.timeSheetEntry.category) {
      const value = this.timeSheetEntry.category.toLowerCase().trim();
      this.filteredCategories = this.categories.filter((category) =>
        category.toLowerCase().includes(value)
      );
    } else {
      this.filteredCategories = [...this.categories];
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
      if (!this.isFormValid()) return;

      if (!this.timeSheetEntry) {
        this.errorMessage = 'Invalid time sheet entry';
        return;
      }

      this.activeModal.close(this.timeSheetEntry);
    } catch (error) {
      this.errorMessage = 'Error saving time sheet entry';
    }
  }

  close(): void {
    this.activeModal.dismiss();
  }

  isFormValid(): boolean {
    let isValid =
      this.selectedProject &&
      this.timeSheetEntry.hours &&
      this.timeSheetEntry.description &&
      this.timeSheetEntry.category;

    if (isValid) return true;
    let errorMessage = 'Please fill in all required fields';
    if (!this.selectedProject) errorMessage += '\n\t• Please select a project';
    if (!this.timeSheetEntry.category)
      errorMessage += '\n\t• Category is required';
    if (!this.timeSheetEntry.hours)
      errorMessage += '\n\t• Hours must be greater than 0';
    if (!this.timeSheetEntry.description)
      errorMessage += '\n\t• Description is required';
    this.errorMessage = errorMessage;
    return false;
  }
}

export interface TimeSheetEntryModalOptions {
  timeSheetEntry?: TimeSheetEntry;
  date: Date;
  categories: string[];
}
