import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Project, TimeSheetEntry } from '@models';

import { FilterViewDetailsComponent } from './filter-view-details.component';

describe('FilterViewDetailsComponent', () => {
  let component: FilterViewDetailsComponent;
  let fixture: ComponentFixture<FilterViewDetailsComponent>;

  function makeEntry(billable: boolean): TimeSheetEntry {
    const entry = new TimeSheetEntry();
    entry.id = billable ? 'billable-entry' : 'non-billable-entry';
    entry.projectId = 'project-1';
    entry.date = new Date('2026-09-20T12:00:00Z');
    entry.hours = 2;
    entry.category = 'General';
    entry.billable = billable;
    return entry;
  }

  const project = { id: 'project-1', name: 'Alpha', fields: [] } as any as Project;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterViewDetailsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterViewDetailsComponent);
    component = fixture.componentInstance;
  });

  it('shows Yes/No for billable in the table view', async () => {
    fixture.componentRef.setInput('entries', [
      makeEntry(true),
      makeEntry(false),
    ]);
    fixture.componentRef.setInput('projects', [project]);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Yes');
    expect(text).toContain('No');
  });

  it('shows Billable/Non-billable in the compact workspace view', async () => {
    fixture.componentRef.setInput('entries', [
      makeEntry(true),
      makeEntry(false),
    ]);
    fixture.componentRef.setInput('projects', [project]);
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Billable');
    expect(text).toContain('Non-billable');
  });
});
