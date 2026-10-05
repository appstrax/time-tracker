import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Project, TimeSheetEntry } from '@models';

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

  it('builds tooltip context with project, category, description, and duration', () => {
    const entry = makeEntry({
      category: 'Development',
      description: 'API work',
      hours: 1.5,
    });

    const project = new Project();
    project.id = 'project-1';
    project.name = 'Time Tracker';
    fixture.componentRef.setInput('projects', [project]);

    expect(component.getEntryTooltipContext(entry)).toEqual({
      project: 'Time Tracker',
      category: 'Development',
      description: 'API work',
      duration: '1h 30m',
    });
  });

  it('does not open approved entries but still opens unapproved ones', () => {
    const approved = makeEntry({ approved: true });
    const open = makeEntry({ approved: false });
    const opened: TimeSheetEntry[] = [];
    component.onEntryClick.subscribe((entry) => opened.push(entry));

    const event = new MouseEvent('click');
    component.onBlockClick(approved, event);
    component.onBlockClick(open, event);

    expect(opened).toEqual([open]);
  });

  it('allows creating an entry when the day contains an approved entry', () => {
    fixture.componentRef.setInput('entries', [
      makeEntry({ approved: true, hours: 1 }),
    ]);
    fixture.detectChanges();

    expect(component.segments()[0].locked).toBeTrue();
    expect(component.disabled()).toBeFalse();
  });
});
