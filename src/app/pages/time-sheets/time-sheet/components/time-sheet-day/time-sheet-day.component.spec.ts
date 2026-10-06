import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { TimeSheetNumberLineComponent } from '../time-sheet-number-line/time-sheet-number-line.component';

import { ToastService, TimeSheetEntryService } from '@services';
import { TimeSheetEntry } from '@models';

import { TimeSheetDayComponent } from './time-sheet-day.component';

describe('TimeSheetDayComponent', () => {
  let component: TimeSheetDayComponent;
  let fixture: ComponentFixture<TimeSheetDayComponent>;
  let modalService: jasmine.SpyObj<NgbModal>;

  beforeEach(async () => {
    modalService = jasmine.createSpyObj<NgbModal>('NgbModal', ['open']);
    modalService.open.and.returnValue({
      componentInstance: {
        initializeFromOptions: jasmine.createSpy('initializeFromOptions'),
      },
      result: Promise.resolve({ action: 'close' }),
    } as any);

    await TestBed.configureTestingModule({
      imports: [TimeSheetDayComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: NgbModal, useValue: modalService },
        {
          provide: ToastService,
          useValue: jasmine.createSpyObj<ToastService>('ToastService', ['error']),
        },
        {
          provide: TimeSheetEntryService,
          useValue: jasmine.createSpyObj<TimeSheetEntryService>(
            'TimeSheetEntryService',
            ['save', 'delete'],
          ),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeSheetDayComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('date', new Date('2026-04-08T00:00:00.000Z'));
    const weekEntry = new TimeSheetEntry();
    weekEntry.category = 'Development';
    fixture.componentRef.setInput('weekEntries', [weekEntry]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should seed hovered hours when opening a new entry', () => {
    component.openTimeSheetEntryModal(2.75);

    expect(modalService.open).toHaveBeenCalled();
    const modalComponent = modalService.open.calls.mostRecent().returnValue
      .componentInstance as {
      timeSheetEntry: TimeSheetEntry;
      date: Date;
      weekEntries: TimeSheetEntry[];
    };

    expect(modalComponent.timeSheetEntry.hours).toBe(2.75);
    expect(modalComponent.timeSheetEntry.projectId).toBe('');
    expect(modalComponent.date).toEqual(component.date());
    expect(modalComponent.weekEntries).toEqual(component.weekEntries());
  });

  function makeEntry(id: string, approved: boolean): TimeSheetEntry {
    const entry = new TimeSheetEntry();
    entry.id = id;
    entry.projectId = 'project-1';
    entry.hours = 1;
    entry.approved = approved;
    entry.createdAt = new Date('2026-04-08T08:00:00.000Z');
    return entry;
  }

  it('still allows creating entries on a day that has an approved entry', () => {
    fixture.componentRef.setInput('entries', [makeEntry('approved-1', true)]);
    fixture.detectChanges();

    const numberLine = fixture.debugElement.query(
      By.directive(TimeSheetNumberLineComponent),
    ).componentInstance as TimeSheetNumberLineComponent;

    expect(numberLine.disabled()).toBeFalse();
    expect(numberLine.allowCreate()).toBeTrue();
  });

  it('locks only approved entry rows', () => {
    fixture.componentRef.setInput('entries', [
      makeEntry('approved-1', true),
      makeEntry('open-1', false),
    ]);
    component.entriesExpanded.set(true);
    fixture.detectChanges();

    const rows = fixture.debugElement
      .queryAll(By.css('button.entry-row'))
      .map((row) => row.nativeElement as HTMLButtonElement);

    expect(rows.length).toBe(2);
    expect(rows[0].disabled).toBeTrue();
    expect(rows[1].disabled).toBeFalse();
  });
});
