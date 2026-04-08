import { Store } from '@state';
import { FormsModule } from '@angular/forms';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { appstraxAuth } from '@appstrax/services/auth';
import {
  Component,
  Input,
  OnInit,
  Signal,
  ViewChild,
  ElementRef,
  computed,
} from '@angular/core';

import { Project, TimeSheetEntry } from '@models';
import { ProjectDropdownComponent } from '@components';
import { TimeSheetDisplayUtil } from '@utils';

@Component({
  selector: 'app-add-project-user',
  standalone: true,
  templateUrl: './time-sheet-entry.modal.html',
  styleUrl: './time-sheet-entry.modal.scss',
  imports: [FormsModule, ProjectDropdownComponent],
})
export class TimeSheetEntryComponent implements OnInit {
  private static readonly LAST_SELECTED_PROJECT_KEY = 'timeSheet.lastProjectId';

  @Input() timeSheetEntry = new TimeSheetEntry();
  @Input() categories!: string[];
  @Input() date!: Date;

  projects = computed(() => this.store.projects.projects());

  project: Project | undefined;
  filteredCategories: string[] = [];

  isCategoryDropdownOpen: boolean = false;

  errorMessage: string = '';

  @ViewChild('hoursTooltip', { static: false }) hoursTooltip!: ElementRef;

  get hours(): number {
    return this.timeSheetEntry?.hours || 0;
  }

  constructor(
    public activeModal: NgbActiveModal,
    private store: Store,
    private displayUtils: TimeSheetDisplayUtil,
  ) {}

  async ngOnInit(): Promise<void> {
    const projectId =
      this.timeSheetEntry.projectId || this.getStoredProjectId();
    if (projectId) {
      this.project = this.projects().find((x) => x.id === projectId);
      if (this.project) {
        this.timeSheetEntry.projectId = this.project.id;
      } else if (!this.timeSheetEntry.projectId) {
        this.clearStoredProjectId();
      }
    }

    this.filteredCategories = [...this.categories];

    const user = await appstraxAuth.getUser();
    this.timeSheetEntry.userId = user.id;
    this.timeSheetEntry.date = this.date;
  }

  formatHours(hours: number): string {
    return this.displayUtils.formatHours(hours);
  }

  onProjectSelected(project: Project | null): void {
    this.project = project || undefined;
    if (!project) {
      this.timeSheetEntry.projectId = '';
      this.clearStoredProjectId();
      return;
    }
    this.timeSheetEntry.projectId = project.id;
    this.storeProjectId(project.id);
  }

  onCategoryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toLowerCase().trim();

    if (value === '') {
      this.filteredCategories = [...this.categories];
      this.isCategoryDropdownOpen = false;
    } else {
      this.filteredCategories = this.categories.filter((category) =>
        category.toLowerCase().includes(value),
      );
      this.isCategoryDropdownOpen = !!this.filteredCategories.length;
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
        category.toLowerCase().includes(value),
      );
    } else {
      this.filteredCategories = [...this.categories];
    }
    this.isCategoryDropdownOpen = !!this.filteredCategories.length;
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

      this.storeProjectId(this.timeSheetEntry.projectId);
      this.activeModal.close({
        action: 'save',
        timeSheetEntry: this.timeSheetEntry,
      });
    } catch (error) {
      this.errorMessage = 'Error saving time sheet entry';
    }
  }

  async onDeleteTimeSheetEntry(): Promise<void> {
    this.activeModal.close({
      action: 'delete',
      timeSheetEntry: this.timeSheetEntry,
    });
  }

  close(): void {
    this.activeModal.dismiss();
  }

  isFormValid(): boolean {
    let isValid =
      this.timeSheetEntry.projectId &&
      this.timeSheetEntry.hours &&
      this.timeSheetEntry.description &&
      this.timeSheetEntry.category;

    if (isValid) return true;
    let errorMessage = 'Please fill in all required fields';
    if (!this.timeSheetEntry.projectId)
      errorMessage += '\n\t• Please select a project';
    if (!this.timeSheetEntry.category)
      errorMessage += '\n\t• Category is required';
    if (!this.timeSheetEntry.hours)
      errorMessage += '\n\t• Hours must be greater than 0';
    if (!this.timeSheetEntry.description)
      errorMessage += '\n\t• Description is required';
    this.errorMessage = errorMessage;
    return false;
  }

  private getStoredProjectId(): string | null {
    try {
      return localStorage.getItem(TimeSheetEntryComponent.LAST_SELECTED_PROJECT_KEY);
    } catch {
      return null;
    }
  }

  private storeProjectId(projectId: string): void {
    if (!projectId) return;
    try {
      localStorage.setItem(
        TimeSheetEntryComponent.LAST_SELECTED_PROJECT_KEY,
        projectId,
      );
    } catch {}
  }

  private clearStoredProjectId(): void {
    try {
      localStorage.removeItem(TimeSheetEntryComponent.LAST_SELECTED_PROJECT_KEY);
    } catch {}
  }
}

export interface TimeSheetEntryModalOptions {
  timeSheetEntry?: TimeSheetEntry;
  date: Date;
  categories: string[];
}
