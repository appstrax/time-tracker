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

  it('escapes HTML in the description when building tooltip content', () => {
    const entry = makeEntry({
      description: '<img src=x onerror=alert(1)>',
    });

    const html = (component as any).getTooltipContent(entry, undefined);

    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('escapes HTML in a configured field value', () => {
    const project = new Project();
    project.id = 'project-1';
    project.fields = [
      { key: 'notes', label: 'Notes', type: 'text', required: false, options: [] },
    ];
    const entry = makeEntry({
      fieldValues: [{ key: 'notes', value: '<b>bold</b>' }],
    });

    const html = (component as any).getTooltipContent(entry, project);

    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(html).toContain('Notes');
  });

  it('omits the configured-fields block entirely when the entry has no field values', () => {
    const project = new Project();
    project.id = 'project-1';
    project.fields = [
      { key: 'notes', label: 'Notes', type: 'text', required: false, options: [] },
    ];
    const entry = makeEntry();

    const html = (component as any).getTooltipContent(entry, project);

    expect(html).not.toContain('Notes');
  });
});
