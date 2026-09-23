import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSheetEntry } from '@models';

import { TimeSheetNumberLineComponent } from './time-sheet-number-line.component';

describe('TimeSheetNumberLineComponent', () => {
  let component: TimeSheetNumberLineComponent;
  let fixture: ComponentFixture<TimeSheetNumberLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSheetNumberLineComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeSheetNumberLineComponent);
    component = fixture.componentInstance;
  });

  function makeEntry(overrides: Partial<TimeSheetEntry> = {}): TimeSheetEntry {
    const entry = new TimeSheetEntry();
    entry.projectId = 'project-1';
    entry.hours = 1;
    entry.category = 'General';
    entry.description = 'desc';
    Object.assign(entry, overrides);
    return entry;
  }

  it('builds tooltip context with category, description, and duration', () => {
    const entry = makeEntry({
      category: 'Development',
      description: 'API work',
      hours: 1.5,
    });

    expect(component.getEntryTooltipContext(entry)).toEqual({
      category: 'Development',
      description: 'API work',
      duration: '1h 30m',
    });
  });
});
