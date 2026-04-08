import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
      componentInstance: {},
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
    fixture.componentRef.setInput('categories', ['Development']);
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
      categories: string[];
    };

    expect(modalComponent.timeSheetEntry.hours).toBe(2.75);
    expect(modalComponent.timeSheetEntry.projectId).toBe('');
    expect(modalComponent.date).toEqual(component.date());
    expect(modalComponent.categories).toEqual(component.categories());
  });
});
