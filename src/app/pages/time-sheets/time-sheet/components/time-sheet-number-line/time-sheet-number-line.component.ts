import { NgStyle } from '@angular/common';
import { Component, Input, OnInit, SimpleChanges, Output, EventEmitter } from '@angular/core';

import { TimeSheetEntry, Project } from '@models';

import { TimeSheetEntryItemComponent } from '../time-sheet-entry-item/time-sheet-entry-item.component';

@Component({
  selector: 'app-time-sheet-number-line',
  standalone: true,
  templateUrl: './time-sheet-number-line.component.html',
  styleUrl: './time-sheet-number-line.component.scss',
  imports: [NgStyle, TimeSheetEntryItemComponent]
})
export class TimeSheetNumberLineComponent implements OnInit {
  @Input() projects: Project[] = [];
  @Input() entries: TimeSheetEntry[] = [];
  @Input() categoryColors: Map<string, string> = new Map<string, string>();

  @Output() onEntryClick: EventEmitter<TimeSheetEntry> = new EventEmitter<TimeSheetEntry>();

  public sizeModifier = 20;
  public numberLineWidths: Map<TimeSheetEntry, number> = new Map<TimeSheetEntry, number>();

  public ngOnInit(): void {
    this.calculateSize();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries']) {
      this.calculateSize();
    }
  }

  private calculateSize(): void {
    this.numberLineWidths = new Map<TimeSheetEntry, number>();
    for (const entry of this.entries) {
      let size = (entry.hours * 4) * this.sizeModifier;
      this.numberLineWidths.set(entry, size);
    }
  }

  public getCategoryColor(entry: TimeSheetEntry): string {
    return this.categoryColors.get(entry.category ?? '') || '#6B7280';
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

  public createNumberLineArray(): number[] {
    let numberLineArray = [];
    for (let i = 0; i <= this.getTotalWorkHours() * 4; i++) {
      numberLineArray.push(i);
    }
    return numberLineArray;
  }

  private getTotalWorkHours(): number {
    let totalWorkHours = this.entries.reduce((sum, entry) => sum + entry.hours, 0);
    if (totalWorkHours > 8) return totalWorkHours;
    return 8;
  }

  public openEntryLogItem(entry: TimeSheetEntry): void {
    this.onEntryClick.emit(entry);
  }

  public getProject(entry: TimeSheetEntry): Project | undefined {
    return this.projects?.find(project => project.id === entry.projectId);
  }
}
