import { DateInputComponent } from '../../components/date-input/date-input.component';
import { FormsModule } from '@angular/forms';
import { appstraxAuth } from '@appstrax/services/auth';
import {
  AfterViewChecked,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  computed,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Store } from '@state';
import { Project, TimeSheetEntry, ProjectField } from '@models';
import { ProjectDropdownComponent } from '@components';
import { ToastService } from '@services';
import {
  categorySuggestions,
  FUTURE_TIMESHEET_ENTRY_TOAST,
  TimeSheetDisplayUtil,
  isFutureLocalCalendarDay,
} from '@utils';

@Component({
  standalone: true,
  templateUrl: './time-sheet-entry.modal.html',
  styleUrl: './time-sheet-entry.modal.scss',
  imports: [FormsModule, ProjectDropdownComponent, DateInputComponent],
})
export class TimeSheetEntryModal
  implements OnInit, OnDestroy, AfterViewChecked
{
  @Input() timeSheetEntry = new TimeSheetEntry();
  @Input() weekEntries: TimeSheetEntry[] = [];
  @Input() date!: Date;
  /** The time sheet's active project filter, or '' on "all projects". A new
   * entry starts on it; the dropdown opens empty when there is no filter. */
  @Input() defaultProjectId = '';

  /** Projects the current user can log time on, plus the entry's existing
   * project (if any) so editing one they can no longer log on still displays it. */
  projects = computed(() => {
    const all = this.store.projects.projects();
    const assigned = this.store.access.logProjects();

    const existingProjectId = this.timeSheetEntry.projectId;
    if (!existingProjectId || assigned.some((p) => p.id === existingProjectId)) {
      return assigned;
    }
    const existing = all.find((p) => p.id === existingProjectId);
    return existing ? [...assigned, existing] : assigned;
  });

  project: Project | undefined;
  filteredCategories: string[] = [];

  errorMessage: string = '';

  wasExistingEntryOnOpen: boolean = false;

  private modalInputsInitialized = false;
  private categoryDropdownCloseTimer: ReturnType<typeof setTimeout> | null =
    null;
  private destroyed = false;

  /** Set when the dropdown's `<ul>` isn't rendered yet (e.g. 0 -> N filtered results); applied once it exists. */
  private pendingDropdownVisible: boolean | null = null;

  /** Keys present when the modal opened — kept on save only if the project is unchanged. */
  private fieldValueKeysAtOpen = new Set<string>();
  private projectIdAtOpen = '';

  @ViewChild('hoursTooltip', { static: false }) hoursTooltip!: ElementRef;
  @ViewChild('categoryDropdownMenu', { static: false })
  categoryDropdownMenu?: ElementRef<HTMLUListElement>;

  get hours(): number {
    return this.timeSheetEntry?.hours || 0;
  }

  constructor(
    public activeModal: NgbActiveModal,
    private store: Store,
    private displayUtils: TimeSheetDisplayUtil,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.initializeFromOptions();
  }

  /** Called after NgbModal `Object.assign` so the week entries and date are available. */
  initializeFromOptions(): void {
    if (this.modalInputsInitialized || !this.date) {
      return;
    }
    this.modalInputsInitialized = true;

    this.wasExistingEntryOnOpen = !!this.timeSheetEntry.id;
    this.fieldValueKeysAtOpen = new Set(
      this.timeSheetEntry.fieldValues.map((fv) => fv.key),
    );

    const projectId = this.timeSheetEntry.projectId || this.defaultProjectId;
    if (projectId) {
      this.project = this.projects().find((x) => x.id === projectId);
      if (this.project) {
        this.timeSheetEntry.projectId = this.project.id;
      }
    }

    this.refreshCategorySuggestions();
    this.projectIdAtOpen = this.timeSheetEntry.projectId;
    this.initializeBooleanFieldDefaults();
    this.initializeBillableDefault();

    void this.assignEntryUser();
  }

  private async assignEntryUser(): Promise<void> {
    const user = await appstraxAuth.getUser();
    if (this.destroyed) return;
    this.timeSheetEntry.userId = user.id;
    this.timeSheetEntry.date = this.date;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.clearCategoryDropdownCloseTimer();
  }

  private clearCategoryDropdownCloseTimer(): void {
    if (this.categoryDropdownCloseTimer === null) return;
    clearTimeout(this.categoryDropdownCloseTimer);
    this.categoryDropdownCloseTimer = null;
  }

  /** Toggle visibility via DOM so modal close does not trip dev-mode CD checks. */
  private setCategoryDropdownVisible(visible: boolean): void {
    this.pendingDropdownVisible = visible;
    this.applyPendingDropdownVisible();
  }

  /** Applies a pending visibility change once the `@if`-gated `<ul>` exists in the DOM. */
  private applyPendingDropdownVisible(): void {
    if (this.pendingDropdownVisible === null) return;
    const menu = this.categoryDropdownMenu?.nativeElement;
    if (!menu) return;
    menu.classList.toggle('show', this.pendingDropdownVisible);
    menu.setAttribute(
      'aria-hidden',
      this.pendingDropdownVisible ? 'false' : 'true',
    );
    this.pendingDropdownVisible = null;
  }

  ngAfterViewChecked(): void {
    this.applyPendingDropdownVisible();
  }

  private scheduleCategoryDropdownClose(): void {
    this.clearCategoryDropdownCloseTimer();
    this.categoryDropdownCloseTimer = setTimeout(() => {
      this.categoryDropdownCloseTimer = null;
      this.setCategoryDropdownVisible(false);
    }, 200);
  }

  formatHours(hours: number): string {
    return this.displayUtils.formatHours(hours);
  }

  onProjectSelected(project: Project | null): void {
    this.project = project || undefined;
    this.timeSheetEntry.projectId = project ? project.id : '';
    this.initializeBooleanFieldDefaults();
    this.initializeBillableDefault();
    this.refreshCategorySuggestions();
  }

  private refreshCategorySuggestions(): void {
    this.filteredCategories = [...this.suggestions()];
  }

  private suggestions(): string[] {
    return categorySuggestions(this.project, this.categoriesForSelectedProject());
  }

  private categoriesForSelectedProject(): string[] {
    const projectId = this.project?.id;
    if (!projectId) return [];
    return this.weekEntries
      .filter((entry) => entry.projectId === projectId)
      .map((entry) => (entry.category ?? '').trim())
      .filter((category) => category.length > 0);
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

    const suggestions = this.suggestions();
    if (value === '') {
      this.filteredCategories = [...suggestions];
      this.setCategoryDropdownVisible(
        document.activeElement === input && suggestions.length > 0,
      );
    } else {
      this.filteredCategories = suggestions.filter((category) =>
        category.toLowerCase().includes(value),
      );
      this.setCategoryDropdownVisible(this.filteredCategories.length > 0);
    }
  }

  selectCategory(category: string): void {
    this.timeSheetEntry.category = category;
    this.clearCategoryDropdownCloseTimer();
    this.setCategoryDropdownVisible(false);
    this.refreshCategorySuggestions();
  }

  onCategoryFocus(): void {
    const suggestions = this.suggestions();
    if (this.timeSheetEntry.category) {
      const value = this.timeSheetEntry.category.toLowerCase().trim();
      this.filteredCategories = suggestions.filter((category) =>
        category.toLowerCase().includes(value),
      );
    } else {
      this.filteredCategories = [...this.suggestions()];
    }
    this.setCategoryDropdownVisible(this.filteredCategories.length > 0);
  }

  onCategoryBlur(): void {
    this.scheduleCategoryDropdownClose();
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
      this.timeSheetEntry.category = this.timeSheetEntry.category.trim();
      this.clearCategoryDropdownCloseTimer();
      this.activeModal.close({
        action: 'save',
        timeSheetEntry: this.timeSheetEntry,
      });
    } catch (error) {
      this.errorMessage = 'Error saving time sheet entry';
    }
  }

  async onDeleteTimeSheetEntry(): Promise<void> {
    this.clearCategoryDropdownCloseTimer();
    this.activeModal.close({
      action: 'delete',
      timeSheetEntry: this.timeSheetEntry,
    });
  }

  close(): void {
    this.clearCategoryDropdownCloseTimer();
    this.activeModal.dismiss();
  }

  isFormValid(): boolean {
    if (!this.wasExistingEntryOnOpen && isFutureLocalCalendarDay(this.date)) {
      this.errorMessage = FUTURE_TIMESHEET_ENTRY_TOAST;
      this.toastService.error(FUTURE_TIMESHEET_ENTRY_TOAST);
      return false;
    }

    const missingFields = this.wasExistingEntryOnOpen
      ? []
      : this.projectFields.filter(
          (field) => field.required && this.isConfiguredFieldMissing(field),
        );

    const category = this.timeSheetEntry.category?.trim() ?? '';
    let isValid =
      this.timeSheetEntry.projectId &&
      this.timeSheetEntry.hours &&
      this.timeSheetEntry.description &&
      category &&
      missingFields.length === 0;

    if (isValid) return true;
    let errorMessage = 'Please fill in all required fields';
    if (!this.timeSheetEntry.projectId)
      errorMessage += '\n\t• Please select a project';
    if (!category)
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

  private isConfiguredFieldMissing(field: ProjectField): boolean {
    const value = this.getFieldValue(field.key);
    if (field.type === 'boolean') {
      return value !== 'true' && value !== 'false';
    }
    return !value.trim();
  }

  private initializeBooleanFieldDefaults(): void {
    if (this.wasExistingEntryOnOpen) return;

    for (const field of this.projectFields) {
      if (field.type !== 'boolean') continue;
      const value = this.getFieldValue(field.key);
      if (value !== 'true' && value !== 'false') {
        this.setFieldValue(field.key, 'false');
      }
    }
  }

  private initializeBillableDefault(): void {
    if (this.wasExistingEntryOnOpen) return;
    this.timeSheetEntry.billable = this.project?.billable ?? true;
  }

  private pruneStaleFieldValues(): void {
    const currentKeys = new Set(this.projectFields.map((field) => field.key));
    const preserveOrphanedKeys =
      this.timeSheetEntry.projectId === this.projectIdAtOpen;
    this.timeSheetEntry.fieldValues = this.timeSheetEntry.fieldValues.filter(
      (fv) =>
        currentKeys.has(fv.key) ||
        (preserveOrphanedKeys && this.fieldValueKeysAtOpen.has(fv.key)),
    );
  }

}

export interface TimeSheetEntryModalOptions {
  timeSheetEntry?: TimeSheetEntry;
  date: Date;
  weekEntries?: TimeSheetEntry[];
  defaultProjectId?: string;
}
