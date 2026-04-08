import { Tooltip } from 'bootstrap';
import { NgStyle } from '@angular/common';
import {
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

import { TimeSheetEntry, Project } from '@models';

@Component({
  selector: 'app-time-sheet-entry-item',
  standalone: true,
  templateUrl: './time-sheet-entry-item.component.html',
  styleUrl: './time-sheet-entry-item.component.scss',
  imports: [NgStyle],
})
export class TimeSheetEntryItemComponent {
  public readonly width = input(0);
  public readonly project = input<Project | undefined>(undefined);
  public readonly entry = input<TimeSheetEntry | undefined>();
  public readonly categoryColor = input('#6B7280');

  public readonly onEntryClick = output<TimeSheetEntry>();

  private readonly tooltipElement = viewChild<ElementRef<HTMLElement>>(
    'tooltipElement',
  );

  constructor() {
    effect((onCleanup) => {
      const tooltipElement = this.tooltipElement();
      const entry = this.entry();
      if (!tooltipElement || !entry) return;

      const element = tooltipElement.nativeElement;
      const tooltip = new Tooltip(element, {
        html: true,
        placement: 'left',
        trigger: 'hover',
        fallbackPlacements: ['bottom'],
        title: this.getTooltipContent(entry, this.project()),
      });
      const onClick = () => tooltip.hide();

      element.removeAttribute('title');
      element.addEventListener('click', onClick);
      onCleanup(() => {
        element.removeEventListener('click', onClick);
        tooltip.dispose();
      });
    });
  }

  private getTooltipContent(entry: TimeSheetEntry, project?: Project): string {
    const hours = Math.floor(entry.hours);
    const minutes = (entry.hours - hours) * 60;
    return `
      <div style="text-align: left;">
        <div class="mb-2"><strong>Project:</strong><br> ${project?.name || 'N/A'}</div>
        <div class="mb-2"><strong>Category:</strong><br> ${entry.category || 'N/A'}</div>
        <div class="mb-2"><strong>Hours:</strong><br> ${hours}h ${minutes}m</div>
        <div class="mb-2"><strong>Description:</strong><br> ${entry.description || 'N/A'}</div>
      </div>
    `;
  }

  public onClick(): void {
    const entry = this.entry();
    if (!entry) return;

    this.onEntryClick.emit(entry);
  }
}

