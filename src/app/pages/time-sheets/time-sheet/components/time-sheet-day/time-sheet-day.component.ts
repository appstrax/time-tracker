import { DatePipe} from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { TimeSheetEntry } from 'src/app/models/time-sheet-entry.model';
import { TimeSheetNumberLineComponent } from '../time-sheet-number-line/time-sheet-number-line.component';

@Component({
  selector: 'app-time-sheet-day',
  standalone: true,
  templateUrl: './time-sheet-day.component.html',
  styleUrl: './time-sheet-day.component.scss',
  imports: [TimeSheetNumberLineComponent, DatePipe]
})
export class TimeSheetDayComponent implements OnInit {

  @Input() date: Date = new Date();
  @Input() entries: TimeSheetEntry[] = [];
  @Input() categoryColors: Map<string, string> = new Map<string, string>();

  ngOnInit(): void {
    
  }
}
