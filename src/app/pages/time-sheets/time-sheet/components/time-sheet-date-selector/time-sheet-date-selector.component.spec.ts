import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSheetDateSelectorComponent } from './time-sheet-date-selector.component';

describe('TimeSheetDateSelectorComponent', () => {
  let component: TimeSheetDateSelectorComponent;
  let fixture: ComponentFixture<TimeSheetDateSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSheetDateSelectorComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeSheetDateSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should advance to the next week from the current week', () => {
    const weekStartBefore = new Date(component.selectedWeekStart());
    component.nextWeek();
    const weekStartAfter = component.selectedWeekStart();

    expect(weekStartAfter.getUTCFullYear()).toBe(weekStartBefore.getUTCFullYear());
    expect(weekStartAfter.getUTCMonth()).toBe(weekStartBefore.getUTCMonth());
    expect(weekStartAfter.getUTCDate()).toBe(
      weekStartBefore.getUTCDate() + 7,
    );
  });

  it('should navigate to a future week via the date picker', () => {
    const currentWeekStart = new Date(component.selectedWeekStart());

    const input = document.createElement('input');
    input.value = '2030-06-12';
    component.onDateSelected({ target: input } as unknown as Event);

    const selectedStart = component.selectedWeekStart();
    expect(selectedStart.getTime()).not.toBe(currentWeekStart.getTime());
    expect(selectedStart.getUTCFullYear()).toBe(2030);
    expect(selectedStart.getUTCMonth()).toBe(5);
    expect(selectedStart.getUTCDate()).toBe(10);
  });
});
