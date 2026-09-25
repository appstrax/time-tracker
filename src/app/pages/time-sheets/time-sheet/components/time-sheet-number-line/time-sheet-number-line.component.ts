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
import { TimeSheetDisplayUtil, getProjectColor } from '@utils';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

export interface TimelineEntryTooltipContext {
  category: string;
  description: string;
  duration: string;
}

interface TimelineSegment {
  entry: TimeSheetEntry;
  leftPercent: number;
  widthPercent: number;
  color: string;
  backgroundColor: string;
  label: string;
  durationLabel: string;
  showInlineDetail: boolean;
  isQuarterHourBlock: boolean;
  tooltipContext: TimelineEntryTooltipContext;
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

  public readonly projects = input<Project[]>([]);
  public readonly projectColorById = input<Map<string, string>>(new Map());
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly disabled = input(false);
  public readonly allowCreate = input(true);

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
    Math.max(12, Math.ceil(this.loggedHours())),
  );

  public readonly hourMarkers = computed(() =>
    Array.from({ length: this.scaleHours() }, (_, index) => index + 1),
  );

  public readonly quarterSlotCount = computed(() => this.scaleHours() * 4);

  public readonly segments = computed((): TimelineSegment[] => {
    const scale = this.scaleHours();
    const entries = this.sortedEntries();
    if (!scale || !entries.length) return [];

    let timeCursor = 0;

    return entries.map((entry) => {
      const color = this.getEntryColor(entry);
      const leftPercent = (timeCursor / scale) * 100;
      const widthPercent = (entry.hours / scale) * 100;
      timeCursor += entry.hours;

      return {
        entry,
        leftPercent,
        widthPercent,
        color,
        label: this.getProjectName(entry),
        durationLabel: this.formatBlockHours(entry.hours),
        backgroundColor: color,
        showInlineDetail: entry.hours >= 0.75,
        isQuarterHourBlock: Math.round(Number(entry.hours) * 4) / 4 === 0.25,
        tooltipContext: this.getEntryTooltipContext(entry),
      };
    });
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
    if (this.disabled() || !this.allowCreate()) return;
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
    if (this.disabled() || !this.allowCreate()) return;
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

  private getProjectName(entry: TimeSheetEntry): string {
    return this.displayUtil.getProjectName(entry.projectId, this.projects());
  }

  private getEntryDescription(entry: TimeSheetEntry): string {
    const description = entry.description?.trim();
    return description || 'No description';
  }

  public getEntryTooltipContext(
    entry: TimeSheetEntry,
  ): TimelineEntryTooltipContext {
    return {
      category: entry.category?.trim() || 'No category',
      description: this.getEntryDescription(entry),
      duration: this.formatBlockHours(entry.hours),
    };
  }

  private getEntryColor(entry: TimeSheetEntry): string {
    const fromMap = this.projectColorById().get(entry.projectId);
    if (fromMap) return fromMap;
    return getProjectColor(entry.projectId, this.projects());
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

}
