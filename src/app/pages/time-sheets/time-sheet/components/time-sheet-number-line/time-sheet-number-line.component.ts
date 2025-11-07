import { NgStyle } from '@angular/common';
import { Component, Input, OnInit, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { TimeSheetEntry } from 'src/app/models/time-sheet-entry.model';
import { Project } from 'src/app/models/project.model';
import { TimeSheetEntryItemComponent } from '../time-sheet-entry-item/time-sheet-entry-item.component';

@Component({
  selector: 'app-time-sheet-number-line',
  imports: [NgStyle, TimeSheetEntryItemComponent],
  standalone: true,
  templateUrl: './time-sheet-number-line.component.html',
  styleUrl: './time-sheet-number-line.component.scss'
})
export class TimeSheetNumberLineComponent implements OnInit {
  @Input() entries: TimeSheetEntry[] = [];
  @Input() categoryColors: Map<string, string> = new Map<string, string>();
  @Input() projects: Project[] = [];

  @Output() onEntryClick: EventEmitter<TimeSheetEntry> = new EventEmitter<TimeSheetEntry>();

  public workHours: Map<TimeSheetEntry, number> = new Map<TimeSheetEntry, number>();
  public modifier = 20;

  ngOnInit() {
    this.calculateSize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries']) {
      this.calculateSize();
    }
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

  getProject(entry: TimeSheetEntry): Project | undefined {
    return this.projects?.find(project => project.id === entry.projectId);
  }
}
