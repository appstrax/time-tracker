import { Tooltip } from 'bootstrap';
import { NgStyle } from '@angular/common';
import { Component, Input, AfterViewInit } from '@angular/core';
import { OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { EventEmitter, Output, OnChanges, SimpleChanges } from '@angular/core';

import { TimeSheetEntry, Project } from '@models';

@Component({
  selector: 'app-time-sheet-entry-item',
  standalone: true,
  templateUrl: './time-sheet-entry-item.component.html',
  styleUrl: './time-sheet-entry-item.component.scss',
  imports: [NgStyle]
})
export class TimeSheetEntryItemComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() width: number = 0;
  @Input() project?: Project;
  @Input() entry!: TimeSheetEntry;
  @Input() categoryColor: string = '#6B7280';

  @Output() onEntryClick: EventEmitter<TimeSheetEntry> = new EventEmitter<TimeSheetEntry>();

  @ViewChild('tooltipElement', { static: false }) tooltipElement!: ElementRef<HTMLElement>;

  private tooltip?: Tooltip;
  private viewInitialized: boolean = false;

  public ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.initializeTooltip();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.viewInitialized && (changes['entry'] || changes['project']) && this.tooltipElement) {
      this.updateTooltip();
    }
  }

  public ngOnDestroy(): void {
    this.disposeTooltip();
  }

  private initializeTooltip(): void {
    if (!this.tooltipElement) return;
    const element = this.tooltipElement.nativeElement;
    const tooltipContent = this.getTooltipContent();
    this.tooltip = new Tooltip(element, {
      html: true,
      placement: 'top',
      trigger: 'hover',
      fallbackPlacements: ['top', 'bottom'],
      title: tooltipContent
    });
    element.removeAttribute('title');
    element.addEventListener('click', () => {
      this.tooltip?.hide();
    });
  }

  private updateTooltip(): void {
    if (!this.tooltip || !this.tooltipElement) return;
    this.disposeTooltip();
    this.initializeTooltip();
  }

  private disposeTooltip(): void {
    if (this.tooltip) {
      this.tooltip.dispose();
      this.tooltip = undefined;
    }
  }

  private getTooltipContent(): string {
    let hours = Math.floor(this.entry.hours);
    let minutes = (this.entry.hours - hours) * 60;
    return `
      <div style="text-align: left;">
        <div class="mb-2"><strong>Project:</strong><br> ${this.project?.name || 'N/A'}</div>
        <div class="mb-2"><strong>Category:</strong><br> ${this.entry.category || 'N/A'}</div>
        <div class="mb-2"><strong>Hours:</strong><br> ${hours}h ${minutes}m</div>
        <div class="mb-2"><strong>Description:</strong><br> ${this.entry.description || 'N/A'}</div>
      </div>
    `;
  }

  public onClick(): void {
    this.onEntryClick.emit(this.entry);
  }
}

