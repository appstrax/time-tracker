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
export class TimeSheetEntryCrudComponent implements OnInit, AfterViewInit {

  @Input() options: TimeSheetEntryCrudOptions = new TimeSheetEntryCrudOptions();

  selectedProject: Project | null = null;

  projects: Signal<Project[]>;
  isProjectMenuOpen: boolean = false;

  @ViewChild('hoursTooltip', { static: false }) hoursTooltip!: ElementRef;

  constructor(
    public ngModal: NgbModal,
    private store: Store,
  ) {
    this.projects = this.store.projects.all;

  }

  ngOnInit(): void {
    if (this.options.timeSheetEntry.projectId) {
      this.selectedProject = this.projects().find(project => project.id === this.options.timeSheetEntry.projectId) ?? null;
    }
  }

  ngAfterViewInit(): void {
    // Initialize tooltip position after view is ready
    setTimeout(() => {
      const hoursInput = document.getElementById('hoursRange') as HTMLInputElement;
      if (hoursInput && this.hoursTooltip) {
        this.updateTooltipPosition(hoursInput);
      }
    }, 0);
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

  onHoursInputChange(value: string): void {
    const parsedHours = this.parseHoursFromString(value);
    if (!isNaN(parsedHours)) {
      this.options.timeSheetEntry.hours = parsedHours;
      // Update tooltip position
      const hoursInput = document.getElementById('hoursRange') as HTMLInputElement;
      if (hoursInput) {
        this.updateTooltipPosition(hoursInput);
      }
    }
  }

  onHoursInputBlur(): void {
    // Ensure the input displays the formatted value
    const hoursInput = document.getElementById('hoursInput') as HTMLInputElement;
    if (hoursInput) {
      hoursInput.value = this.formatHours(this.hoursValue);
    }
  }

  onRangeInputChange(input: HTMLInputElement): void {
    this.updateTooltipPosition(input);
    // Force input field to update
    const hoursInput = document.getElementById('hoursInput') as HTMLInputElement;
    if (hoursInput) {
      hoursInput.value = this.formatHours(this.hoursValue);
    }
  }

  updateTooltipPosition(input: HTMLInputElement): void {
    // Tooltip is now fixed on the right side, no positioning needed
  }

  toggleProjectMenu(): void {
    this.isProjectMenuOpen = !this.isProjectMenuOpen;
  }

  selectProject(project: Project): void {
    this.selectedProject = project;
    this.isProjectMenuOpen = false;
  }

  onSaveTimeSheetEntry() {
    if (!this.isFormValid()) return;
    if (!this.options?.timeSheetEntry) return;
    if (this.selectedProject) {
      this.options.timeSheetEntry.projectId = this.selectedProject.id!;
    }
    this.options.onSave(this.options.timeSheetEntry);
    this.ngModal.dismissAll();
  }

  close() {
    this.ngModal.dismissAll();
  }

  isFormValid(): boolean {
    return this.selectedProject != null &&
    this.options.timeSheetEntry.hours > 0 &&
    this.options.timeSheetEntry.description != '' &&
    this.options.timeSheetEntry.category != '';
  }
}

export class TimeSheetEntryCrudOptions extends ModalCrudOptions<TimeSheetEntry> {
  timeSheetEntry!: TimeSheetEntry;
}
