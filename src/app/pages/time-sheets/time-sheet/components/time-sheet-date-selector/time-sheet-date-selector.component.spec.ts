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

    component.onDateSelected({ year: 2030, month: 6, day: 12 });

    const selectedStart = component.selectedWeekStart();
    expect(selectedStart.getTime()).not.toBe(currentWeekStart.getTime());
    expect(selectedStart.getUTCFullYear()).toBe(2030);
    expect(selectedStart.getUTCMonth()).toBe(5);
    expect(selectedStart.getUTCDate()).toBe(10);
  });

  it('should highlight the selected week in the picker', () => {
    component.onDateSelected({ year: 2030, month: 6, day: 12 });

    expect(component.dayClasses({ year: 2030, month: 6, day: 10 })).toEqual(
      jasmine.objectContaining({ 'in-week': true, 'week-start': true }),
    );
    expect(component.dayClasses({ year: 2030, month: 6, day: 16 })).toEqual(
      jasmine.objectContaining({ 'in-week': true, 'week-end': true }),
    );
    expect(component.dayClasses({ year: 2030, month: 6, day: 17 })['in-week']).toBe(
      false,
    );
  });

  it('should highlight the whole hovered week and clear on leave', () => {
    component.onDayHover({ year: 2030, month: 6, day: 12 });

    expect(component.dayClasses({ year: 2030, month: 6, day: 10 })['hover-week']).toBe(true);
    expect(component.dayClasses({ year: 2030, month: 6, day: 16 })['hover-week']).toBe(true);
    expect(component.dayClasses({ year: 2030, month: 6, day: 17 })['hover-week']).toBe(false);
    expect(component.dayClasses({ year: 2030, month: 6, day: 9 })['hover-week']).toBe(false);

    component.onDayHover(null);
    expect(component.dayClasses({ year: 2030, month: 6, day: 12 })['hover-week']).toBe(false);
  });
});
