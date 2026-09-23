import { NgStyle } from '@angular/common';
import {
  Component,
  computed,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { Tooltip } from 'bootstrap';

import { TimeSheetEntry, Project } from '@models';
import { ColorList } from '@utils';

interface EntryAtIndex {
  entry: TimeSheetEntry;
  index: number;
}

@Component({
  selector: 'app-time-sheet-number-line',
  standalone: true,
  templateUrl: './time-sheet-number-line.component.html',
  styleUrl: './time-sheet-number-line.component.scss',
  imports: [NgStyle],
})
export class TimeSheetNumberLineComponent implements OnDestroy {
  public readonly colorIndex = input(0);
  public readonly projects = input<Project[]>([]);
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly disabled = input(false);

  public readonly onEntryClick = output<TimeSheetEntry>();
  public readonly onCreateEntry = output<number>();

  public readonly hoveredQuarterHours = signal<number | null>(null);
  public readonly loggedQuarterHours = computed(() =>
    this.entries().reduce(
      (sum, entry) => sum + this.convertHoursToQuarterHours(entry.hours),
      0,
    ),
  );
  public readonly totalWorkQuarterHours = computed(() =>
    Math.max(12 * 4, this.loggedQuarterHours()),
  );

  public readonly numberLineArray = computed(() =>
    Array.from(
      { length: this.totalWorkQuarterHours() + 1 },
      (_, index) => index,
    ),
  );

  public readonly totalLoggedLabel = computed(
    () => `${this.formatHours(this.loggedQuarterHours() / 4)} logged`,
  );

  private tooltip: Tooltip | undefined = undefined;

  constructor() {}

  ngOnDestroy(): void {
    this.hideTooltip();
  }

  public getColor(i: number): string {
    const entry = this.getEntryAtIndex(i);
    if (!entry) return '';

    return ColorList.colors[
      (this.colorIndex() * 4 + entry.index) % ColorList.colors.length
    ];
  }

  public getEntryAtIndex(index: number): EntryAtIndex | undefined {
    if (!this.isTickLogged(index)) return undefined;

    const time = index / 4;
    let cumulativeHours = 0;
    const entries = this.entries();
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (cumulativeHours + entry.hours >= time) {
        return { entry, index: i };
      }
      cumulativeHours += entry.hours;
    }

    return undefined;
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

  public isTickInteractive(i: number): boolean {
    return !this.disabled() && i > this.loggedQuarterHours();
  }

  public isTickLogged(i: number): boolean {
    return i > 0 && i <= this.loggedQuarterHours();
  }

  public isTickHovered(i: number): boolean {
    const hoveredQuarterHours = this.hoveredQuarterHours();
    const loggedQuarterHours = this.loggedQuarterHours();
    return (
      !!hoveredQuarterHours &&
      hoveredQuarterHours > loggedQuarterHours &&
      i > loggedQuarterHours &&
      i <= hoveredQuarterHours
    );
  }

  public onNumberLineHover(i: number, event: MouseEvent | FocusEvent): void {
    const entry = this.getEntryAtIndex(i);
    if (entry) {
      this.showTooltip(entry, event.target! as HTMLElement);
    } else {
      this.hideTooltip();
      this.hoveredQuarterHours.set(i);
    }
  }

  private showTooltip(entry: EntryAtIndex, element: HTMLElement): void {
    this.hideTooltip();

    this.tooltip = new Tooltip(element, {
      html: true,
      trigger: 'manual',
      title: this.getTooltipContent(entry.entry, this.getProject(entry.entry)),
    });
    this.tooltip.show();
  }

  private getProject(entry: TimeSheetEntry): Project | undefined {
    return this.projects().find((project) => project.id === entry.projectId);
  }

  private getTooltipContent(entry: TimeSheetEntry, project?: Project): string {
    const hours = Math.floor(entry.hours);
    const minutes = (entry.hours - hours) * 60;
    return `
      <div class="p-2">
        <div class="mb-2"><strong>Project:</strong><br> ${project?.name || 'N/A'}</div>
        <div class="mb-2"><strong>Category:</strong><br> ${entry.category || 'N/A'}</div>
        <div class="mb-2"><strong>Hours:</strong><br> ${hours}h ${minutes}m</div>
        <div><strong>Description:</strong><br> ${entry.description || 'N/A'}</div>
      </div>
    `;
  }

  public onNumberLineLeave(): void {
    this.hoveredQuarterHours.set(null);
    this.hideTooltip();
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.dispose();
      this.tooltip = undefined;
    }
  }

  public onNumberLineClick(i: number): void {
    const entry = this.getEntryAtIndex(i);
    if (entry) {
      this.onEntryClick.emit(entry.entry);
    } else {
      this.onCreateEntry.emit(i / 4);
    }
    this.hideTooltip();
    this.hoveredQuarterHours.set(null);
  }

  private convertHoursToQuarterHours(hours: number): number {
    return Math.round(hours * 4);
  }

  private formatHours(hours: number): string {
    const formattedHours = hours.toFixed(2);
    return `${parseFloat(formattedHours)}h`;
  }
}
