import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appstraxAuth } from '@appstrax/services/auth';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Project } from '@models';
import { Store } from '@state';
import { ToastService } from '@services';
import { TimeSheetDisplayUtil } from '@utils';

import { TimeSheetEntryModal } from './time-sheet-entry.modal';

describe('TimeSheetEntryComponent', () => {
  const storageKey = 'timeSheet.lastProjectId';
  const project = {
    id: 'project-1',
    name: 'Alpha',
    fields: [],
  } as any as Project;

  const projectWithFields = {
    id: 'project-2',
    name: 'Beta',
    fields: [
      { key: 'notes', label: 'Notes', type: 'text', required: true, options: [] },
      { key: 'optional-tag', label: 'Tag', type: 'text', required: false, options: [] },
    ],
  } as any as Project;

  const projectWithOptionalBoolean = {
    id: 'project-4',
    name: 'Delta',
    fields: [
      {
        key: 'urgent',
        label: 'Urgent',
        type: 'boolean',
        required: false,
        options: [],
      },
    ],
  } as any as Project;

  const projectWithRequiredBoolean = {
    id: 'project-3',
    name: 'Gamma',
    fields: [
      { key: 'notes', label: 'Notes', type: 'text', required: true, options: [] },
      {
        key: 'billable',
        label: 'Billable',
        type: 'boolean',
        required: true,
        options: [],
      },
    ],
  } as any as Project;

  const projectWithCategories = {
    id: 'project-cat',
    name: 'Cat Project',
    fields: [],
    categories: ['Development', 'Meetings'],
    allowCustomCategory: true,
  } as any as Project;

  const projectStrictCategories = {
    id: 'project-strict',
    name: 'Strict Project',
    fields: [],
    categories: ['Development'],
    allowCustomCategory: false,
  } as any as Project;

  let component: TimeSheetEntryModal;
  let fixture: ComponentFixture<TimeSheetEntryModal>;
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
      imports: [TimeSheetEntryModal],
      providers: [
        provideZonelessChangeDetection(),
        { provide: NgbActiveModal, useValue: activeModal },
        {
          provide: Store,
          useValue: {
            projects: {
              projects: signal([
                project,
                projectWithFields,
                projectWithOptionalBoolean,
                projectWithRequiredBoolean,
              ]),
            },
          },
        },
        {
          provide: TimeSheetDisplayUtil,
          useValue: displayUtil,
        },
        {
          provide: ToastService,
          useValue: jasmine.createSpyObj<ToastService>('ToastService', [
            'error',
            'success',
            'info',
            'warning',
            'show',
          ]),
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  async function createComponent(): Promise<void> {
    fixture = TestBed.createComponent(TimeSheetEntryModal);
    component = fixture.componentInstance;
    component.categories = [];
    component.date = new Date();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function fillRequiredBaseFields(): void {
    component.timeSheetEntry.hours = 1;
    component.timeSheetEntry.description = 'did work';
    component.timeSheetEntry.category = 'General';
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

  it('should not write to storage merely by selecting a project', async () => {
    await createComponent();

    component.onProjectSelected(project);

    expect(component.timeSheetEntry.projectId).toBe(project.id);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should store the selected project id only on save', async () => {
    await createComponent();

    component.onProjectSelected(project);
    fillRequiredBaseFields();
    component.onSaveTimeSheetEntry();

    expect(localStorage.getItem(storageKey)).toBe(project.id);
    expect(activeModal.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ action: 'save' }),
    );
  });

  it('should expose no configured fields for a project with none', async () => {
    await createComponent();
    component.onProjectSelected(project);

    expect(component.projectFields).toEqual([]);
  });

  it('should expose the selected project\'s configured fields', async () => {
    await createComponent();
    component.onProjectSelected(projectWithFields);

    expect(component.projectFields.map((f) => f.key)).toEqual([
      'notes',
      'optional-tag',
    ]);
  });

  it('should block saving a new entry when a required configured field is empty', async () => {
    await createComponent();
    component.onProjectSelected(projectWithFields);
    fillRequiredBaseFields();

    const isValid = component.isFormValid();

    expect(isValid).toBe(false);
    expect(component.errorMessage).toContain('Notes is required');
  });

  it('should allow saving once the required configured field is filled', async () => {
    await createComponent();
    component.onProjectSelected(projectWithFields);
    fillRequiredBaseFields();
    component.setFieldValue('notes', 'some notes');

    expect(component.isFormValid()).toBe(true);
  });

  it('should store an empty string when a field value is cleared (null or undefined)', async () => {
    await createComponent();
    component.onProjectSelected(projectWithFields);
    component.setFieldValue('optional-tag', '42');
    component.setFieldValue('optional-tag', null);
    expect(component.getFieldValue('optional-tag')).toBe('');
    component.setFieldValue('optional-tag', 'x');
    component.setFieldValue('optional-tag', undefined);
    expect(component.getFieldValue('optional-tag')).toBe('');
  });

  it('should preserve a typed field value when switching project and back', async () => {
    await createComponent();
    component.onProjectSelected(projectWithFields);
    component.setFieldValue('notes', 'kept across switches');

    component.onProjectSelected(project);
    component.onProjectSelected(projectWithFields);

    expect(component.getFieldValue('notes')).toBe('kept across switches');
  });

  it('should preserve field values for keys that existed when editing a pre-existing entry', async () => {
    fixture = TestBed.createComponent(TimeSheetEntryModal);
    component = fixture.componentInstance;
    component.categories = [];
    component.date = new Date();
    component.timeSheetEntry.id = 'existing-entry-id';
    component.timeSheetEntry.projectId = projectWithFields.id;
    component.timeSheetEntry.fieldValues = [
      { key: 'legacy-client-ref', value: 'ACME-1' },
      { key: 'notes', value: 'historical note' },
    ];
    fixture.detectChanges();
    await fixture.whenStable();

    fillRequiredBaseFields();

    component.onSaveTimeSheetEntry();

    const keys = component.timeSheetEntry.fieldValues.map((fv) => fv.key);
    expect(keys).toContain('legacy-client-ref');
    expect(
      component.timeSheetEntry.fieldValues.find(
        (fv) => fv.key === 'legacy-client-ref',
      )?.value,
    ).toBe('ACME-1');
  });

  it('should drop orphaned field values when a pre-existing entry is moved to another project', async () => {
    fixture = TestBed.createComponent(TimeSheetEntryModal);
    component = fixture.componentInstance;
    component.categories = [];
    component.date = new Date();
    component.timeSheetEntry.id = 'existing-entry-id';
    component.timeSheetEntry.projectId = projectWithFields.id;
    component.timeSheetEntry.fieldValues = [
      { key: 'client-ref', value: 'ACME' },
      { key: 'notes', value: 'historical note' },
    ];
    fixture.detectChanges();
    await fixture.whenStable();

    component.onProjectSelected(project);
    fillRequiredBaseFields();

    component.onSaveTimeSheetEntry();

    const keys = component.timeSheetEntry.fieldValues.map((fv) => fv.key);
    expect(keys).not.toContain('client-ref');
    expect(keys).not.toContain('notes');
  });

  it('should drop values for fields outside the currently selected project on save', async () => {
    await createComponent();
    component.onProjectSelected(projectWithFields);
    component.setFieldValue('notes', 'a note');
    component.setFieldValue('leftover-from-elsewhere', 'stale');
    fillRequiredBaseFields();

    component.onSaveTimeSheetEntry();

    const keys = component.timeSheetEntry.fieldValues.map((fv) => fv.key);
    expect(keys).toEqual(['notes']);
  });

  it('should default an untouched optional boolean to "No" for a new entry', async () => {
    await createComponent();
    component.onProjectSelected(projectWithOptionalBoolean);

    expect(component.getFieldValue('urgent')).toBe('false');
    expect(component.isFormValid()).toBe(false); // base fields still unfilled
  });

  it('should default an untouched required boolean to No for a new entry', async () => {
    await createComponent();
    component.onProjectSelected(projectWithRequiredBoolean);
    fillRequiredBaseFields();
    component.setFieldValue('notes', 'done');

    expect(component.getFieldValue('billable')).toBe('false');
    expect(component.isFormValid()).toBe(true);
  });

  it('should default a required boolean when the project is pre-selected on open', async () => {
    localStorage.setItem(storageKey, projectWithRequiredBoolean.id);

    await createComponent();
    fillRequiredBaseFields();
    component.setFieldValue('notes', 'done');

    expect(component.getFieldValue('billable')).toBe('false');
    expect(component.isFormValid()).toBe(true);
  });

  it('should use project categories for suggestions instead of week fallback', async () => {
    await createComponent();
    component.categories = ['Legacy'];
    component.onProjectSelected(projectWithCategories);

    expect(component.filteredCategories).toEqual(['Development', 'Meetings']);
  });

  it('should keep week fallback when project has no category list', async () => {
    await createComponent();
    component.categories = ['Legacy'];
    component.onProjectSelected(project);

    expect(component.filteredCategories).toEqual(['Legacy']);
  });

  it('should allow custom category text when allowCustomCategory is true', async () => {
    await createComponent();
    component.onProjectSelected(projectWithCategories);
    fillRequiredBaseFields();
    component.timeSheetEntry.category = 'Custom work';

    expect(component.isFormValid()).toBe(true);
  });

  it('should reject custom category when allowCustomCategory is false', async () => {
    await createComponent();
    component.onProjectSelected(projectStrictCategories);
    fillRequiredBaseFields();
    component.timeSheetEntry.category = 'Custom work';

    expect(component.isFormValid()).toBe(false);
    expect(component.errorMessage).toContain("project's categories");
  });

  it('should grandfather an existing off-list category when custom is disabled', async () => {
    fixture = TestBed.createComponent(TimeSheetEntryModal);
    component = fixture.componentInstance;
    component.categories = [];
    component.date = new Date();
    component.timeSheetEntry.id = 'existing-entry-id';
    component.timeSheetEntry.category = 'Legacy standup';
    component.timeSheetEntry.projectId = projectStrictCategories.id;
    fixture.detectChanges();
    await fixture.whenStable();

    fillRequiredBaseFields();

    expect(component.isFormValid()).toBe(true);
  });

  it('should reject an off-list category when an existing entry is moved to a strict project', async () => {
    fixture = TestBed.createComponent(TimeSheetEntryModal);
    component = fixture.componentInstance;
    component.categories = [];
    component.date = new Date();
    component.timeSheetEntry.id = 'existing-entry-id';
    component.timeSheetEntry.category = 'Legacy standup';
    component.timeSheetEntry.projectId = project.id;
    fixture.detectChanges();
    await fixture.whenStable();

    component.onProjectSelected(projectStrictCategories);
    fillRequiredBaseFields();

    expect(component.isFormValid()).toBe(false);
    expect(component.errorMessage).toContain("project's categories");
  });

  it('should skip required-configured-field validation for a pre-existing entry (capture-forward)', async () => {
    await createComponent();
    component.timeSheetEntry.id = 'existing-entry-id';
    component.wasExistingEntryOnOpen = true;
    component.onProjectSelected(projectWithFields);
    fillRequiredBaseFields();
    // 'notes' (required) deliberately left blank.

    expect(component.isFormValid()).toBe(true);
  });
});
