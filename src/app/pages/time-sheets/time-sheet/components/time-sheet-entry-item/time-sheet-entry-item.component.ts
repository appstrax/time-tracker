import { NgStyle } from '@angular/common';
import { Component, Input, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, EventEmitter, Output, OnChanges, SimpleChanges } from '@angular/core';
import { TimeSheetEntry } from 'src/app/models/time-sheet-entry.model';
import { Tooltip } from 'bootstrap';
import { Project } from 'src/app/models/project.model';

@Component({
  selector: 'app-time-sheet-entry-item',
  imports: [NgStyle],
  standalone: true,
  templateUrl: './time-sheet-entry-item.component.html',
  styleUrl: './time-sheet-entry-item.component.scss'
})
export class TimeSheetEntryItemComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() entry!: TimeSheetEntry;
  @Input() width: number = 0;
  @Input() categoryColor: string = '#6B7280';
  @Input() project?: Project;

  @Output() onEntryClick: EventEmitter<TimeSheetEntry> = new EventEmitter<TimeSheetEntry>();

  @ViewChild('tooltipElement', { static: false }) tooltipElement!: ElementRef<HTMLElement>;

  private tooltip?: Tooltip;
  private viewInitialized: boolean = false;

  ngAfterViewInit() {
    this.viewInitialized = true;
    this.initializeTooltip();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.viewInitialized && (changes['entry'] || changes['project']) && this.tooltipElement) {
      setTimeout(() => {
        this.updateTooltip();
      }, 0);
    }
  }

  ngOnDestroy() {
    this.disposeTooltip();
  }

  private initializeTooltip() {
    if (!this.tooltipElement) return;

    this.disposeTooltip();

    this.tooltip = new Tooltip(this.tooltipElement.nativeElement, {
      html: true,
      placement: 'top',
      trigger: 'hover',
      fallbackPlacements: ['top', 'bottom']
    });

    this.tooltipElement.nativeElement.addEventListener('click', () => {
      this.tooltip?.hide();
    });
  }

  private updateTooltip() {
    if (!this.tooltip || !this.tooltipElement) return;
    const newContent = this.getTooltipContent();
    this.tooltipElement.nativeElement.setAttribute('title', newContent);
    try {
      if (typeof (this.tooltip as any).setContent === 'function') {
        (this.tooltip as any).setContent({ '.tooltip-inner': newContent });
      } else {
        this.disposeTooltip();
        this.initializeTooltip();
      }
    } catch (e) {
      this.disposeTooltip();
      this.initializeTooltip();
    }
  }

  private disposeTooltip() {
    if (this.tooltip) {
      try {
        this.tooltip.dispose();
      } catch (e) {
      }
      this.tooltip = undefined;
    }
  }

  getTooltipContent(): string {
    let hours = Math.floor(this.entry.hours);
    let minutes = (this.entry.hours - hours) * 60;
    return `
      <div style="text-align: left;">
        <strong>Project:</strong> ${this.project?.name || 'N/A'}<br>
        <strong>Category:</strong> ${this.entry.category || 'N/A'}<br>
        <strong>Description:</strong><br> ${this.entry.description || 'N/A'}<br>
        <strong>Hours:</strong> ${hours}h ${minutes}m
      </div>
    `;
  }

  onClick() {
    this.onEntryClick.emit(this.entry);
  }
}

