import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { Project, TimeSheetEntry } from '@models';
import { TimeSheetDisplayUtil } from '@utils';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

interface TimelineSegment {
  entry: TimeSheetEntry;
  widthPercent: number;
  color: string;
  backgroundColor: string;
  descriptionLabel: string;
  durationLabel: string;
  showInlineDetail: boolean;
  tooltipText: string;
}

@Component({
  selector: 'app-time-sheet-number-line',
  standalone: true,
  templateUrl: './time-sheet-number-line.component.html',
  styleUrl: './time-sheet-number-line.component.scss',
  imports: [NgbTooltipModule],
})
export class TimeSheetNumberLineComponent {
  private readonly displayUtil = inject(TimeSheetDisplayUtil);

  public readonly colorIndex = input(0);
  public readonly projects = input<Project[]>([]);
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly disabled = input(false);

  public readonly onEntryClick = output<TimeSheetEntry>();
  public readonly onCreateEntry = output<number>();

  private readonly trackRef = viewChild<ElementRef<HTMLElement>>('track');

  public readonly hoverTotalHours = signal<number | null>(null);

  private readonly sortedEntries = computed(() =>
    [...this.entries()].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    ),
  );

  public readonly loggedHours = computed(() =>
    this.sortedEntries().reduce((sum, entry) => sum + entry.hours, 0),
  );

  public readonly scaleHours = computed(() =>
    Math.max(12, this.loggedHours()),
  );

  public readonly hourMarkers = computed(() =>
    Array.from({ length: 12 }, (_, index) => index + 1),
  );

  public readonly quarterSlotCount = computed(() => this.scaleHours() * 4);

  public readonly segments = computed((): TimelineSegment[] => {
    const scale = this.scaleHours();
    if (!scale) return [];

    return this.sortedEntries().map((entry, index) => ({
      entry,
      widthPercent: (entry.hours / scale) * 100,
      color: this.getEntryColor(entry, index),
      descriptionLabel: this.getEntryDescription(entry),
      durationLabel: this.formatBlockHours(entry.hours),
      backgroundColor: this.getBlockBackground(this.getEntryColor(entry, index)),
      showInlineDetail: entry.hours > 1,
      tooltipText: this.getBlockTooltipText(entry),
    }));
  });

  public readonly previewLeftPercent = computed(() => {
    const scale = this.scaleHours();
    if (!scale) return 0;
    return (this.loggedHours() / scale) * 100;
  });

  public readonly previewWidthPercent = computed(() => {
    const hoverTotal = this.hoverTotalHours();
    const logged = this.loggedHours();
    const scale = this.scaleHours();
    if (hoverTotal === null || hoverTotal <= logged || !scale) return 0;
    return ((hoverTotal - logged) / scale) * 100;
  });

  public readonly previewDurationLabel = computed(() => {
    const hoverTotal = this.hoverTotalHours();
    const logged = this.loggedHours();
    if (hoverTotal === null || hoverTotal <= logged) return '';
    return this.formatBlockHours(hoverTotal - logged);
  });

  public readonly previewBackgroundColor = computed(() =>
    this.getPreviewBackground('var(--color-primary)'),
  );

  public onTrackMouseMove(event: MouseEvent): void {
    if (this.disabled()) return;
    const total = this.hoursAtPointer(event);
    if (total === null) return;
    if (total <= this.loggedHours()) {
      this.hoverTotalHours.set(null);
      return;
    }
    this.hoverTotalHours.set(total);
  }

  public onTrackLeave(): void {
    this.hoverTotalHours.set(null);
  }

  public onTrackClick(event: MouseEvent): void {
    if (this.disabled()) return;
    const target = event.target as HTMLElement;
    if (target.closest('.timeline-block')) return;

    const total = this.hoursAtPointer(event);
    if (total === null) return;

    if (total <= this.loggedHours()) return;
    this.onCreateEntry.emit(total);
    this.hoverTotalHours.set(null);
  }

  public onBlockClick(entry: TimeSheetEntry, event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.onEntryClick.emit(entry);
  }

  private hoursAtPointer(event: MouseEvent): number | null {
    const track = this.trackRef()?.nativeElement;
    if (!track) return null;

    const rect = track.getBoundingClientRect();
    if (!rect.width) return null;

    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    const rawHours = ratio * this.scaleHours();
    return Math.round(rawHours * 4) / 4;
  }

  private getEntryDescription(entry: TimeSheetEntry): string {
    const description = entry.description?.trim();
    return description || 'No description';
  }

  private getBlockTooltipText(entry: TimeSheetEntry): string {
    const project = this.projects().find((item) => item.id === entry.projectId);
    const lines = [
      project?.name ? `Project: ${project.name}` : '',
      `Duration: ${this.formatBlockHours(entry.hours)}`,
      `Description: ${this.getEntryDescription(entry)}`,
    ].filter((line) => line.length > 0);
    return lines.join('\n');
  }

  private getEntryColor(_entry: TimeSheetEntry, _index: number): string {
    return 'var(--color-primary)';
  }

  private getBlockBackground(color: string): string {
    return `color-mix(in srgb, ${color} 60%, transparent)`;
  }

  private getPreviewBackground(color: string): string {
    return `color-mix(in srgb, ${color} 30%, transparent)`;
  }

  private formatBlockHours(hours: number): string {
    return this.displayUtil.formatQuarterHourDuration(hours);
  }

  /** @internal Used by unit tests for HTML escaping coverage. */
  public escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** @internal Used by unit tests for HTML escaping coverage. */
  public getTooltipContent(entry: TimeSheetEntry, project?: Project): string {
    const hours = Math.floor(entry.hours);
    const minutes = (entry.hours - hours) * 60;
    return `
      <div class="p-2">
        <div class="mb-2"><strong>Project:</strong><br> ${this.escapeHtml(project?.name || 'N/A')}</div>
        <div class="mb-2"><strong>Category:</strong><br> ${this.escapeHtml(entry.category || 'N/A')}</div>
        <div class="mb-2"><strong>Hours:</strong><br> ${hours}h ${minutes}m</div>
        <div><strong>Description:</strong><br> ${this.escapeHtml(entry.description || 'N/A')}</div>
        ${this.getFieldValuesHtml(entry, project)}
      </div>
    `;
  }

  private getFieldValuesHtml(entry: TimeSheetEntry, project?: Project): string {
    const fields = project?.fields ?? [];
    const rows = fields
      .map((field) => {
        const value = entry.fieldValues.find((fv) => fv.key === field.key)?.value;
        if (!value) return '';
        return `<div class="mb-2"><strong>${this.escapeHtml(field.label || field.key)}:</strong><br> ${this.escapeHtml(value)}</div>`;
      })
      .filter((row) => row.length > 0);

    return rows.join('');
  }
}
