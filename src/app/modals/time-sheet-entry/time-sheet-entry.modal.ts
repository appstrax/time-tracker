import { FormsModule } from '@angular/forms';
import { appstraxAuth } from '@appstrax/services/auth';
import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  computed,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Store } from '@state';
import { Project, TimeSheetEntry, ProjectField } from '@models';
import { ProjectDropdownComponent } from '@components';
import {
  clearStoredTimeSheetProjectId,
  getStoredTimeSheetProjectId,
  storeTimeSheetProjectId,
  TimeSheetDisplayUtil,
} from '@utils';

@Component({
  standalone: true,
  templateUrl: './time-sheet-entry.modal.html',
  styleUrl: './time-sheet-entry.modal.scss',
  imports: [FormsModule, ProjectDropdownComponent],
})
export class TimeSheetEntryModal implements OnInit {
  @Input() timeSheetEntry = new TimeSheetEntry();
  @Input() categories!: string[];
  @Input() date!: Date;

  projects = computed(() => this.store.projects.projects());

  project: Project | undefined;
  filteredCategories: string[] = [];

  isCategoryDropdownOpen: boolean = false;

  errorMessage: string = '';

  wasExistingEntryOnOpen: boolean = false;

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
    this.wasExistingEntryOnOpen = !!this.timeSheetEntry.id;

    const projectId =
      this.timeSheetEntry.projectId || getStoredTimeSheetProjectId();
    if (projectId) {
      this.project = this.projects().find((x) => x.id === projectId);
      if (this.project) {
        this.timeSheetEntry.projectId = this.project.id;
      } else if (!this.timeSheetEntry.projectId) {
        clearStoredTimeSheetProjectId();
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
    this.timeSheetEntry.projectId = project ? project.id : '';
  }

  get projectFields(): ProjectField[] {
    return this.project?.fields ?? [];
  }

  getFieldValue(key: string): string {
    return (
      this.timeSheetEntry.fieldValues.find((fv) => fv.key === key)?.value ?? ''
    );
  }

  setFieldValue(
    key: string,
    value: string | number | null | undefined,
  ): void {
    const normalized = value == null ? '' : String(value);
    const existing = this.timeSheetEntry.fieldValues.find(
      (fv) => fv.key === key,
    );
    if (existing) {
      existing.value = normalized;
    } else {
      this.timeSheetEntry.fieldValues = [
        ...this.timeSheetEntry.fieldValues,
        { key, value: normalized },
      ];
    }
  }

  isFieldBoolean(field: ProjectField): boolean {
    return this.getFieldValue(field.key) === 'true';
  }

  setFieldBoolean(key: string, checked: boolean): void {
    this.setFieldValue(key, checked ? 'true' : 'false');
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

      this.pruneStaleFieldValues();
      storeTimeSheetProjectId(this.timeSheetEntry.projectId);
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
    const missingFields = this.wasExistingEntryOnOpen
      ? []
      : this.projectFields.filter(
          (field) => field.required && !this.getFieldValue(field.key).trim(),
        );

    let isValid =
      this.timeSheetEntry.projectId &&
      this.timeSheetEntry.hours &&
      this.timeSheetEntry.description &&
      this.timeSheetEntry.category &&
      missingFields.length === 0;

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
    for (const field of missingFields) {
      errorMessage += `\n\t• ${field.label || field.key} is required`;
    }
    this.errorMessage = errorMessage;
    return false;
  }

  private pruneStaleFieldValues(): void {
    const currentKeys = new Set(this.projectFields.map((field) => field.key));
    this.timeSheetEntry.fieldValues = this.timeSheetEntry.fieldValues.filter(
      (fv) => currentKeys.has(fv.key),
    );
  }

}

export interface TimeSheetEntryModalOptions {
  timeSheetEntry?: TimeSheetEntry;
  date: Date;
  categories: string[];
}
