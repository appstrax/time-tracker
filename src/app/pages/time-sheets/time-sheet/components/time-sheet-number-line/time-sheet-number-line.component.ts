import { NgStyle } from '@angular/common';
import { Component, Input, OnInit, AfterViewInit, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { TimeSheetEntry } from 'src/app/models/time-sheet-entry.model';
import { Tooltip } from 'bootstrap';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-time-sheet-number-line',
  imports: [NgStyle],
  standalone: true,
  templateUrl: './time-sheet-number-line.component.html',
  styleUrl: './time-sheet-number-line.component.scss'
})
export class TimeSheetNumberLineComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() entries: TimeSheetEntry[] = [];
  @Input() categoryColors:Map<string, string> = new Map<string, string>();

  @ViewChildren('tooltipElement') tooltipElements!: QueryList<ElementRef<HTMLElement>>;

  public workHours: Map<TimeSheetEntry, number> = new Map<TimeSheetEntry, number>();
  public modifier = 20;
  private tooltips: Tooltip[] = [];
  private tooltipSubscription?: Subscription;

  ngOnInit() {
    this.calculateSize();
  }

  ngAfterViewInit() {
    this.initializeTooltips();
    this.tooltipSubscription = this.tooltipElements.changes.subscribe(() => {
      this.initializeTooltips();
    });
  }

  disposeTooltips() {
    this.tooltips.forEach((tooltip) => tooltip.dispose());
    this.tooltips = [];
  }

  initializeTooltips() {
    this.tooltipElements.forEach((elementRef) => {
      const tooltip = new Tooltip(elementRef.nativeElement, {
        html: true,
        placement: 'top',
        trigger: 'hover'
      });
      this.tooltips.push(tooltip);
    });
  }

  getTooltipContent(entry: TimeSheetEntry): string {
    return `
      <div style="text-align: left;">
        <strong>Entry:</strong> ${entry.id || 'N/A'}<hr>
        <strong>Project:</strong> ${entry.projectId || 'N/A'}<br>
        <strong>Category:</strong> ${entry.category || 'N/A'}<br>
        <strong>Description:</strong><br> ${entry.description || 'N/A'}
      </div>
    `;
  }

  calculateSize() {
    this.workHours = new Map<TimeSheetEntry, number>();
    for (const entry of this.entries) {
      let size = (entry.hours*4) * this.modifier;
      this.workHours.set(entry, size);
    }
  }

  getCategoryColor(entry: TimeSheetEntry): string {
    
    return this.categoryColors.get(entry.category ?? '') || '#6B7280'; // Default gray color
  }

  getNumberLineValue(i: number) {
    if (i % 4 === 0) {
      return `${i / 4.0}`;
    }
    return '';
  }

  getNumberLineHeight(i: number) {
    if (i % 4 === 0) {
      return '20px';
    } else if (i % 2 === 0) {
      return '14px';
    }
    return '8px';
  }

  createNumberLineArray() {
    let numberLineArray = [];
    for (let i = 0; i <= this.getTotalWorkHours() * 4; i++) {
      numberLineArray.push(i);
    }
    return numberLineArray;
  }

  getTotalWorkHours() {
    let totalWorkHours = this.entries.reduce((sum, entry) => sum + entry.hours, 0);
    if (totalWorkHours > 8) {
      return totalWorkHours;
    } else {
      return 8;
    }
  }

  openEntryLogItem(entry: TimeSheetEntry) {
  }

  ngOnDestroy() {
    this.tooltipSubscription?.unsubscribe();
    this.disposeTooltips();
  }
}
