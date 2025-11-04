import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-time-sheet-date-selector',
  standalone: true,
  templateUrl: './time-sheet-date-selector.component.html',
  styleUrl: './time-sheet-date-selector.component.scss'
})
export class TimeSheetDateSelectorComponent implements OnInit {
  @Output() weekChange = new EventEmitter<{ start: Date; end: Date }>();
  
  public currentWeekStart: Date = new Date();
  public currentWeekEnd: Date = new Date();
  private latestWeekStart: Date = new Date();

  ngOnInit(): void {
    this.initializeCurrentWeek();
    this.emitWeekChange();
  }

  initializeCurrentWeek(): void {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setUTCDate(today.getUTCDate() + diff);
    this.currentWeekStart.setUTCHours(0, 0, 0, 0);
    
    this.currentWeekEnd = new Date(this.currentWeekStart);
    this.currentWeekEnd.setUTCDate(this.currentWeekStart.getUTCDate() + 6);
    this.currentWeekEnd.setUTCHours(0, 0, 0, 0);
    
    this.latestWeekStart = new Date(this.currentWeekStart);
  }

  previousWeek(): void {
    this.currentWeekStart.setUTCDate(this.currentWeekStart.getUTCDate() - 7);
    this.currentWeekEnd.setUTCDate(this.currentWeekEnd.getUTCDate() - 7);
    this.emitWeekChange();
  }

  nextWeek(): void {
    if (this.canGoToNextWeek()) {
      this.currentWeekStart.setUTCDate(this.currentWeekStart.getUTCDate() + 7);
      this.currentWeekEnd.setUTCDate(this.currentWeekEnd.getUTCDate() + 7);
      this.emitWeekChange();
    }
  }

  canGoToNextWeek(): boolean {
    const nextWeekStart = new Date(this.currentWeekStart);
    nextWeekStart.setUTCDate(this.currentWeekStart.getUTCDate() + 7);
    // Compare dates by comparing their time values (getTime())
    return nextWeekStart.getTime() <= this.latestWeekStart.getTime();
  }

  goToCurrentWeek(): void {
    this.initializeCurrentWeek();
    this.emitWeekChange();
  }

  emitWeekChange(): void {
    this.weekChange.emit({
      start: new Date(this.currentWeekStart),
      end: new Date(this.currentWeekEnd)
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
