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

  function mockTrackGeometry(width = 1200, left = 100): void {
    const track = fixture.nativeElement.querySelector(
      '.timeline-track',
    ) as HTMLElement;
    spyOn(track, 'getBoundingClientRect').and.returnValue({
      left,
      width,
      top: 0,
      height: 40,
      right: left + width,
      bottom: 40,
      x: left,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
  }

  function hoverAtTotalHours(totalHours: number, trackWidth = 1200): void {
    const scale = Math.max(12, totalHours);
    const left = 100;
    const clientX = left + (totalHours / scale) * trackWidth;
    mockTrackGeometry(trackWidth, left);
    component.onTrackMouseMove({ clientX } as MouseEvent);
    fixture.detectChanges();
  }

  it('labels a quarter-hour entry as 15m', () => {
    fixture.componentRef.setInput('entries', [makeEntry({ hours: 0.25 })]);
    fixture.detectChanges();

    expect(component.segments()[0].durationLabel).toBe('15m');
    expect(component.segments()[0].isQuarterHourBlock).toBe(true);
  });

  it('treats string quarter-hour values as quarter-hour blocks', () => {
    fixture.componentRef.setInput('entries', [
      makeEntry({ hours: '0.25' as unknown as number }),
    ]);
    fixture.detectChanges();

    expect(component.segments()[0].isQuarterHourBlock).toBe(true);
  });

  it('shows 15m on the hover preview for a new quarter-hour slice', () => {
    fixture.componentRef.setInput('entries', []);
    fixture.detectChanges();

    hoverAtTotalHours(0.25);

    expect(component.previewDurationLabel()).toBe('15m');
    expect(component.previewWidthPercent()).toBeGreaterThan(0);
  });

  it('shows 15m on the hover preview when adding a quarter hour after logged time', () => {
    fixture.componentRef.setInput('entries', [makeEntry({ hours: 1 })]);
    fixture.detectChanges();

    hoverAtTotalHours(1.25);

    expect(component.previewDurationLabel()).toBe('15m');
  });

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
