import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Project } from '@models';
import {
  ProjectService,
  ProjectUserService,
  ToastService,
  UsersService,
} from '@services';
import { Store } from '@state';

import { ProjectPage } from './project.page';

describe('ProjectPage — billable', () => {
  let component: ProjectPage;
  let fixture: ComponentFixture<ProjectPage>;
  let projectService: jasmine.SpyObj<ProjectService>;

  function configure(projectId: string | null): void {
    TestBed.configureTestingModule({
      imports: [ProjectPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(
                projectId ? { id: projectId } : {},
              ),
            },
          },
        },
        { provide: Store, useValue: { projects: { projects: () => [] }, user: { user: () => null } } },
        {
          provide: ToastService,
          useValue: jasmine.createSpyObj<ToastService>('ToastService', [
            'error',
            'success',
            'info',
          ]),
        },
        { provide: ProjectService, useValue: projectService },
        {
          provide: ProjectUserService,
          useValue: jasmine.createSpyObj<ProjectUserService>(
            'ProjectUserService',
            ['save', 'findByProjectId'],
          ),
        },
        {
          provide: UsersService,
          useValue: jasmine.createSpyObj<UsersService>('UsersService', [
            'fetchUsers',
            'findByUserIds',
          ]),
        },
        {
          provide: NgbModal,
          useValue: jasmine.createSpyObj<NgbModal>('NgbModal', ['open']),
        },
      ],
    });
  }

  beforeEach(() => {
    projectService = jasmine.createSpyObj<ProjectService>('ProjectService', [
      'save',
      'findById',
    ]);
  });

  async function createForNewProject(): Promise<void> {
    configure(null);
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(ProjectPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('defaults a new project\'s billable setting to true', async () => {
    await createForNewProject();

    expect(component.project().billable).toBe(true);
  });

  it('marks the project core dirty once billable is toggled away from its saved value', async () => {
    const existing = new Project();
    existing.id = 'project-1';
    existing.name = 'Alpha';
    existing.description = 'Alpha project';
    existing.billable = true;

    projectService.findById.and.resolveTo(existing);
    configure(existing.id);
    TestBed.overrideProvider(Store, {
      useValue: {
        projects: { projects: () => [existing] },
        user: { user: () => null },
      },
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(ProjectPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.areCoreDirty()).toBe(false);

    component.updateProjectBillable(false);

    expect(component.project().billable).toBe(false);
    expect(component.areCoreDirty()).toBe(true);
  });

  it('preserves the saved billable value when saving categories separately', async () => {
    const existing = new Project();
    existing.id = 'project-1';
    existing.name = 'Alpha';
    existing.description = 'Alpha project';
    existing.billable = false;

    const projectsSignal = { projects: () => [existing] };
    projectService.findById.and.resolveTo(existing);
    projectService.save.and.callFake(async (p: Project) => p);

    configure(existing.id);
    TestBed.overrideProvider(Store, {
      useValue: { projects: projectsSignal, user: { user: () => null } },
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(ProjectPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    // An in-flight, not-yet-saved billable edit should not leak into a
    // categories-only save.
    component.updateProjectBillable(true);
    component.addCategory();
    component.updateCategoryAt(0, 'Development');

    await component.saveCategories();

    const saved = projectService.save.calls.mostRecent().args[0] as Project;
    expect(saved.billable).toBe(false);
  });
});
