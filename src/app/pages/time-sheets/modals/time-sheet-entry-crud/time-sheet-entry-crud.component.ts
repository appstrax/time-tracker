import {Component, Input, OnInit, Signal, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import {FormControl, FormsModule, Validators} from '@angular/forms';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CommonModule} from '@angular/common';
import { TimeSheetEntry } from 'src/app/models/time-sheet-entry.model';
import { Project } from 'src/app/models/project.model';
import { Store } from '@state';
import { ModalCrudOptions } from 'src/app/services/modal.service';

@Component({
  selector: 'app-add-project-user',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './time-sheet-entry-crud.component.html',
  styleUrl: './time-sheet-entry-crud.component.scss'
})
export class TimeSheetEntryCrudComponent implements OnInit {

  @Input() options: TimeSheetEntryCrudOptions = new TimeSheetEntryCrudOptions();

  selectedProject: Project | null = null;

  projects: Signal<Project[]>;
  isProjectMenuOpen: boolean = false;

  timeSheetEntry: TimeSheetEntry = new TimeSheetEntry();
  availableCategories: string[] = [];
  filteredCategories: string[] = [];
  isCategoryDropdownOpen: boolean = false;

  @ViewChild('hoursTooltip', { static: false }) hoursTooltip!: ElementRef;

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
    this.availableCategories = this.options.availableCategories || [];
    this.filteredCategories = [...this.availableCategories];
  }

  formatHours(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (wholeHours === 0 && minutes === 0) {
      return '0h 00m';
    }

    if (wholeHours === 0) {
      return `0h ${minutes}m`;
    }

    if (minutes === 0) {
      return `${wholeHours}h 00m`;
    }

    return `${wholeHours}h ${minutes}m`;
  }

  get hoursValue(): number {
    return this.options?.timeSheetEntry?.hours || 0;
  }

  parseHoursFromString(input: string): number {
    // Remove whitespace and convert to lowercase
    const cleaned = input.trim().toLowerCase();

    // Handle empty or zero
    if (!cleaned || cleaned === '0' || cleaned === '0h' || cleaned === '0m') {
      return 0;
    }

    let totalHours = 0;

    // Match patterns like "2h 30m", "2h", "30m", "2.5h", etc.
    const hourMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*h/);
    const minuteMatch = cleaned.match(/(\d+)\s*m/);

    if (hourMatch) {
      totalHours += parseFloat(hourMatch[1]);
    }

    if (minuteMatch) {
      totalHours += parseFloat(minuteMatch[1]) / 60;
    }

    // If no h or m found, try parsing as decimal hours
    if (!hourMatch && !minuteMatch) {
      const decimalMatch = cleaned.match(/^(\d+(?:\.\d+)?)$/);
      if (decimalMatch) {
        totalHours = parseFloat(decimalMatch[1]);
      }
    }

    // Clamp between 0 and 24
    return Math.max(0, Math.min(24, totalHours));
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
      this.filteredCategories = [...this.availableCategories];
      this.isCategoryDropdownOpen = false;
    } else {
      this.filteredCategories = this.availableCategories.filter(cat => 
        cat.toLowerCase().includes(value)
      );
      this.isCategoryDropdownOpen = this.filteredCategories.length > 0;
    }
  }

  selectCategory(category: string): void {
    this.timeSheetEntry.category = category;
    this.isCategoryDropdownOpen = false;
    this.filteredCategories = [...this.availableCategories];
  }

  onCategoryFocus(): void {
    if (this.timeSheetEntry.category) {
      const value = this.timeSheetEntry.category.toLowerCase().trim();
      this.filteredCategories = this.availableCategories.filter(cat => 
        cat.toLowerCase().includes(value)
      );
    } else {
      this.filteredCategories = [...this.availableCategories];
    }
    if (this.filteredCategories.length > 0) {
      this.isCategoryDropdownOpen = true;
    }
  }

  onCategoryBlur(): void {
    // Delay closing to allow click events to fire
    setTimeout(() => {
      this.isCategoryDropdownOpen = false;
    }, 200);
  }

  onSaveTimeSheetEntry() {
    if (!this.isFormValid()) return;
    if (!this?.timeSheetEntry) return;
    if (this.selectedProject) {
      this.timeSheetEntry.projectId = this.selectedProject.id!;
    }
    this.options.timeSheetEntry.update(this.timeSheetEntry);
    this.options.onSave(this.options.timeSheetEntry);
    this.ngModal.dismissAll();
  }

  close() {
    this.ngModal.dismissAll();
  }

  isFormValid(): boolean {
    return this.selectedProject != null &&
    this.timeSheetEntry.hours > 0 &&
    this.timeSheetEntry.description != '' &&
    this.timeSheetEntry.category != '';
  }
}

export class TimeSheetEntryCrudOptions extends ModalCrudOptions<TimeSheetEntry> {
  timeSheetEntry!: TimeSheetEntry;
  availableCategories: string[] = [];
}
