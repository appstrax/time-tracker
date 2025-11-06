import { NgStyle } from '@angular/common';
import { Component, Input, OnInit, AfterViewInit, OnDestroy, ViewChildren, QueryList, ElementRef, EventEmitter, Output, Signal, SimpleChanges } from '@angular/core';
import { TimeSheetEntry } from 'src/app/models/time-sheet-entry.model';
import { Tooltip } from 'bootstrap';
import { Subscription } from 'rxjs';
import { Project } from 'src/app/models/project.model';

@Component({
  selector: 'app-time-sheet-number-line',
  imports: [NgStyle],
  standalone: true,
  templateUrl: './time-sheet-number-line.component.html',
  styleUrl: './time-sheet-number-line.component.scss'
})
export class TimeSheetNumberLineComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() entries: TimeSheetEntry[] = [];
  @Input() categoryColors: Map<string, string> = new Map<string, string>();
  @Input() projects: Project[] = [];

  @Output() onEntryClick: EventEmitter<TimeSheetEntry> = new EventEmitter<TimeSheetEntry>();

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries']) {
      this.calculateSize();
    }
  }

  disposeTooltips() {
    this.tooltips.forEach((tooltip) => tooltip.dispose());
    this.tooltips = [];
  }

  initializeTooltips() {
    this.disposeTooltips();

    this.tooltipElements.forEach((elementRef) => {
      const tooltip = new Tooltip(elementRef.nativeElement, {
        html: true,
        placement: 'top',
        trigger: 'hover',
        fallbackPlacements: ['top', 'bottom']
      });
      elementRef.nativeElement.addEventListener('click', () => {
        tooltip.hide();
      });
      this.tooltips.push(tooltip);
    });
  }

  getTooltipContent(entry: TimeSheetEntry): string {
    let hours = Math.floor(entry.hours);
    let minutes = (entry.hours - hours) * 60;
    return `
      <div style="text-align: left;">
        <strong>Project:</strong> ${this.getProjectName(entry) || 'N/A'}<br>
        <strong>Category:</strong> ${entry.category || 'N/A'}<br>
        <strong>Description:</strong><br> ${entry.description || 'N/A'}<br>
        <strong>Hours:</strong> ${hours}h ${minutes}m
      </div>
    `;
  }

  calculateSize() {
    this.workHours = new Map<TimeSheetEntry, number>();
    for (const entry of this.entries) {
      let size = (entry.hours * 4) * this.modifier;
      this.workHours.set(entry, size);
    }
  }

  getCategoryColor(entry: TimeSheetEntry): string {

    return this.categoryColors.get(entry.category ?? '') || '#6B7280'; 
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
    this.onEntryClick.emit(entry);
  }

  getProjectName(entry: TimeSheetEntry): string {
    return this.projects?.find(project => project.id === entry.projectId)?.name ?? 'N/A';
  }

  ngOnDestroy() {
    this.tooltipSubscription?.unsubscribe();
    this.disposeTooltips();
  }
}
