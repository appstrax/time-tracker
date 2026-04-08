import { NgStyle } from '@angular/common';
import {
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

import { TimeSheetEntry, Project } from '@models';

import { TimeSheetEntryItemComponent } from '../time-sheet-entry-item/time-sheet-entry-item.component';

@Component({
  selector: 'app-time-sheet-number-line',
  standalone: true,
  templateUrl: './time-sheet-number-line.component.html',
  styleUrl: './time-sheet-number-line.component.scss',
  imports: [NgStyle, TimeSheetEntryItemComponent],
})
export class TimeSheetNumberLineComponent {
  public readonly projects = input<Project[]>([]);
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly categoryColors = input<Map<string, string>>(
    new Map<string, string>(),
  );
  public readonly disabled = input(false);

  public readonly onEntryClick = output<TimeSheetEntry>();
  public readonly onCreateEntry = output<number>();

  public readonly sizeModifier = signal(20);
  public readonly hoveredQuarterHours = signal<number | null>(null);
  public readonly numberLineWidths = computed(() => {
    const widths = new Map<TimeSheetEntry, number>();
    const sizeModifier = this.sizeModifier();
    for (const entry of this.entries()) {
      const size = entry.hours * 4 * sizeModifier;
      widths.set(entry, size);
    }
    return widths;
  });
  public readonly numberLineArray = computed(() =>
    Array.from({ length: this.getTotalWorkHours() * 4 + 1 }, (_, index) => index),
  );
  public readonly hoverPreviewWidth = computed(
    () => (this.hoveredQuarterHours() || 0) * this.sizeModifier(),
  );

  public getCategoryColor(entry: TimeSheetEntry): string {
    return this.categoryColors().get(entry.category ?? '') || '#6B7280';
  }

  public getNumberLineValue(i: number): string {
    if (!(i % 4)) return `${i / 4.0}`;
    return '';
  }

  public getNumberLineHeight(i: number): string {
    if (!(i % 4)) return '20px';
    if (!(i % 2)) return '14px';
    return '8px';
  }

  public onNumberLineHover(i: number): void {
    if (this.disabled() || i === 0) return;
    this.hoveredQuarterHours.set(i);
  }

  public onNumberLineLeave(): void {
    this.hoveredQuarterHours.set(null);
  }

  public createEntryAt(i: number): void {
    if (this.disabled() || i === 0) return;
    this.hoveredQuarterHours.set(null);
    this.onCreateEntry.emit(i / 4);
  }

  private getTotalWorkHours(): number {
    const totalWorkHours = this.entries().reduce(
      (sum, entry) => sum + entry.hours,
      0,
    );
    if (totalWorkHours > 8) return totalWorkHours;
    return 8;
  }

  public openEntryLogItem(entry: TimeSheetEntry): void {
    this.onEntryClick.emit(entry);
  }

  public getProject(entry: TimeSheetEntry): Project | undefined {
    return this.projects().find((project) => project.id === entry.projectId);
  }
}
