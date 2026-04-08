import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appstraxAuth } from '@appstrax/services/auth';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Project } from '@models';
import { Store } from '@state';
import { TimeSheetDisplayUtil } from '@utils';

import { TimeSheetEntryComponent } from './time-sheet-entry.modal';

describe('TimeSheetEntryComponent', () => {
  const storageKey = 'timeSheet.lastProjectId';
  const project = {
    id: 'project-1',
    name: 'Alpha',
  } as Project;

  let component: TimeSheetEntryComponent;
  let fixture: ComponentFixture<TimeSheetEntryComponent>;
  let activeModal: jasmine.SpyObj<NgbActiveModal>;
  let displayUtil: jasmine.SpyObj<TimeSheetDisplayUtil>;

  beforeEach(async () => {
    spyOn(appstraxAuth, 'getUser').and.resolveTo({ id: 'test-user' } as any);
    activeModal = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', [
      'close',
      'dismiss',
    ]);
    displayUtil = jasmine.createSpyObj<TimeSheetDisplayUtil>(
      'TimeSheetDisplayUtil',
      ['formatHours'],
    );
    displayUtil.formatHours.and.returnValue('0h 00m');

    await TestBed.configureTestingModule({
      imports: [TimeSheetEntryComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: NgbActiveModal, useValue: activeModal },
        {
          provide: Store,
          useValue: {
            projects: {
              projects: signal([project]),
            },
          },
        },
        {
          provide: TimeSheetDisplayUtil,
          useValue: displayUtil,
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  async function createComponent(): Promise<void> {
    fixture = TestBed.createComponent(TimeSheetEntryComponent);
    component = fixture.componentInstance;
    component.categories = [];
    component.date = new Date();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('should preselect the last stored project for a new entry', async () => {
    localStorage.setItem(storageKey, project.id);

    await createComponent();

    expect(component.project?.id).toBe(project.id);
    expect(component.timeSheetEntry.projectId).toBe(project.id);
  });

  it('should store the selected project id', async () => {
    await createComponent();

    component.onProjectSelected(project);

    expect(component.timeSheetEntry.projectId).toBe(project.id);
    expect(localStorage.getItem(storageKey)).toBe(project.id);
  });
});
