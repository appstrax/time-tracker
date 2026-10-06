import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appstraxAuth } from '@appstrax/services/auth';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Project, User, UserRole } from '@models';
import { Store } from '@state';
import { ToastService } from '@services';
import { TimeSheetDisplayUtil } from '@utils';

import { TimeSheetEntryModal } from './time-sheet-entry.modal';

describe('TimeSheetEntryComponent', () => {
  const regularUser = { id: 'test-user', role: UserRole.USER } as User;

  const project = {
    id: 'project-1',
    name: 'Alpha',
    fields: [],
    users: [],
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
            user: {
              user: signal(regularUser),
            },
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

  async function createComponent(defaultProjectId = ''): Promise<void> {
    fixture = TestBed.createComponent(TimeSheetEntryModal);
    component = fixture.componentInstance;
    component.weekEntries = [];
    component.date = new Date();
    component.defaultProjectId = defaultProjectId;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function entryFor(projectId: string, category: string): TimeSheetEntry {
    const entry = new TimeSheetEntry();
    entry.projectId = projectId;
    entry.category = category;
    return entry;
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

  it('should preselect the active filter project for a new entry', async () => {
    await createComponent(project.id);

    expect(component.project?.id).toBe(project.id);
    expect(component.timeSheetEntry.projectId).toBe(project.id);
  });

  it('should leave the project empty for a new entry on "all projects"', async () => {
    await createComponent();

    expect(component.project).toBeUndefined();
    expect(component.timeSheetEntry.projectId).toBe('');
  });

  it('should not remember a saved entry\'s project for the next new entry', async () => {
    await createComponent();
    component.onProjectSelected(project);
    fillRequiredBaseFields();
    component.onSaveTimeSheetEntry();

    expect(activeModal.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ action: 'save' }),
    );

    await createComponent();

    expect(component.project).toBeUndefined();
    expect(component.timeSheetEntry.projectId).toBe('');
  });

  it('should keep an existing entry\'s project over the active filter', async () => {
    fixture = TestBed.createComponent(TimeSheetEntryModal);
    component = fixture.componentInstance;
    component.weekEntries = [];
    component.date = new Date();
    component.defaultProjectId = project.id;
    component.timeSheetEntry.id = 'existing-entry-id';
    component.timeSheetEntry.projectId = projectWithFields.id;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.project?.id).toBe(projectWithFields.id);
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
    component.weekEntries = [];
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
    component.weekEntries = [];
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
    await createComponent(projectWithRequiredBoolean.id);
    fillRequiredBaseFields();
    component.setFieldValue('notes', 'done');

    expect(component.getFieldValue('billable')).toBe('false');
    expect(component.isFormValid()).toBe(true);
  });

  it('lists the selected project categories, then only that project\'s week categories', async () => {
    await createComponent();
    component.weekEntries = [
      entryFor(projectWithCategories.id, 'Legacy'),
      entryFor(project.id, 'Dob'),
    ];
    component.onProjectSelected(projectWithCategories);

    expect(component.filteredCategories).toEqual([
      'Development',
      'Meetings',
      'Legacy',
    ]);
  });

  it('should keep week fallback when project has no category list', async () => {
    await createComponent();
    component.weekEntries = [entryFor(project.id, 'Legacy')];
    component.onProjectSelected(project);

    expect(component.filteredCategories).toEqual(['Legacy']);
  });

  it('rejects a blank category', async () => {
    await createComponent();
    component.onProjectSelected(projectWithCategories);
    fillRequiredBaseFields();
    component.timeSheetEntry.category = '   ';

    expect(component.isFormValid()).toBe(false);
    expect(component.errorMessage).toContain('Category is required');
  });

  it('should allow custom category text for any project', async () => {
    await createComponent();
    component.onProjectSelected(projectWithCategories);
    fillRequiredBaseFields();
    component.timeSheetEntry.category = 'Custom work';

    expect(component.isFormValid()).toBe(true);
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

describe('TimeSheetEntryModal — admin project membership', () => {
  const adminUser = { id: 'admin-user', role: UserRole.ADMIN } as User;

  const myProject = {
    id: 'my-project',
    name: 'My Project',
    fields: [],
    users: [{ id: 'admin-user' } as User],
  } as any as Project;

  const otherProject = {
    id: 'other-project',
    name: 'Other Project',
    fields: [],
    users: [{ id: 'someone-else' } as User],
  } as any as Project;

  let component: TimeSheetEntryModal;
  let fixture: ComponentFixture<TimeSheetEntryModal>;
  let activeModal: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    spyOn(appstraxAuth, 'getUser').and.resolveTo({ id: adminUser.id } as any);
    activeModal = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', [
      'close',
      'dismiss',
    ]);

    await TestBed.configureTestingModule({
      imports: [TimeSheetEntryModal],
      providers: [
        provideZonelessChangeDetection(),
        { provide: NgbActiveModal, useValue: activeModal },
        {
          provide: Store,
          useValue: {
            user: { user: signal(adminUser) },
            projects: {
              projects: signal([myProject, otherProject]),
            },
          },
        },
        {
          provide: TimeSheetDisplayUtil,
          useValue: jasmine.createSpyObj<TimeSheetDisplayUtil>(
            'TimeSheetDisplayUtil',
            ['formatHours'],
          ),
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

  it('only lists projects the admin is a member of', async () => {
    fixture = TestBed.createComponent(TimeSheetEntryModal);
    component = fixture.componentInstance;
    component.categories = [];
    component.date = new Date();
    component.defaultProjectId = '';
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.projects().map((p) => p.id)).toEqual([myProject.id]);
  });

  it('still shows an existing entry\'s project even if the admin is not a member', async () => {
    fixture = TestBed.createComponent(TimeSheetEntryModal);
    component = fixture.componentInstance;
    component.categories = [];
    component.date = new Date();
    component.timeSheetEntry.id = 'existing-entry-id';
    component.timeSheetEntry.projectId = otherProject.id;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.project?.id).toBe(otherProject.id);
    expect(component.projects().map((p) => p.id)).toContain(otherProject.id);
  });

  it('shows an empty list when the admin has no assigned projects', async () => {
    TestBed.overrideProvider(Store, {
      useValue: {
        user: { user: signal(adminUser) },
        projects: { projects: signal([otherProject]) },
      },
    });
    fixture = TestBed.createComponent(TimeSheetEntryModal);
    component = fixture.componentInstance;
    component.categories = [];
    component.date = new Date();
    component.defaultProjectId = '';
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.projects()).toEqual([]);
  });
});
