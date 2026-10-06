import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { Project, TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, UsersService } from '@services';
import { Store } from '@state';

import { ProjectAnalyticsPage } from './project-analytics.page';

function makeUser(id: string): User {
  const user = new User();
  user.id = id;
  user.name = id;
  return user;
}

function makeEntry(
  id: string,
  userId: string,
  category: string,
  projectId = 'alpha',
): TimeSheetEntry {
  const entry = new TimeSheetEntry();
  entry.id = id;
  entry.projectId = projectId;
  entry.userId = userId;
  entry.category = category;
  entry.hours = 1;
  entry.date = new Date(2026, 0, 15);
  entry.approved = true;
  return entry;
}

describe('ProjectAnalyticsPage', () => {
  let component: ProjectAnalyticsPage;
  let fixture: ComponentFixture<ProjectAnalyticsPage>;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let findByProjectId: jasmine.Spy<
    (ids: string[]) => Promise<TimeSheetEntry[]>
  >;

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(convertToParamMap({ projectId: 'alpha' }));
    findByProjectId = jasmine
      .createSpy('findByProjectId')
      .and.callFake(async (ids: string[]) => {
        const projectId = ids[0];
        if (projectId === 'beta') {
          return [makeEntry('b1', 'u1', 'Development', 'beta')];
        }
        return [
          makeEntry('e1', 'u1', 'Development'),
          makeEntry('e2', 'u2', 'Support'),
          makeEntry('e3', 'exmember', 'Admin'),
        ];
      });
    const alpha = new Project();
    alpha.id = 'alpha';
    alpha.name = 'Alpha';
    alpha.categories = ['Development', 'Meetings'];
    alpha.users = [makeUser('u1'), makeUser('u2')];

    const storeStub = {
      projects: {
        projects: signal<Project[]>([alpha]),
        fetchedAt: signal<Date | null>(new Date()),
      },
    };

    await TestBed.configureTestingModule({
      imports: [ProjectAnalyticsPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: Store, useValue: storeStub },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            paramMap: paramMap$.asObservable(),
            snapshot: {
              paramMap: {
                get: (key: string) => paramMap$.value.get(key),
              },
            },
          },
        },
        {
          provide: TimeSheetEntryService,
          useValue: { findByProjectId },
        },
        {
          provide: UsersService,
          useValue: {
            fetchUsers: async () => [
              makeUser('u1'),
              makeUser('u2'),
              makeUser('exmember'),
              makeUser('outsider'),
            ],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectAnalyticsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offers this project’s members and anyone who logged time on it', () => {
    expect(component.filterUsers().map((user) => user.id)).toEqual([
      'u1',
      'u2',
      'exmember',
    ]);
  });

  it('leaves out users with neither membership nor hours here', () => {
    expect(component.filterUsers().map((user) => user.id)).not.toContain(
      'outsider',
    );
  });

  it('keeps a filtered non-member visible so the applied filter is shown', () => {
    component.filter.set({ userId: 'outsider' });
    expect(component.filterUsers().map((user) => user.id)).toEqual([
      'u1',
      'u2',
      'exmember',
      'outsider',
    ]);
  });

  it('lists every category when no team member is selected', () => {
    component.filter.set({});
    expect(component.categories()).toEqual([
      'Development',
      'Meetings',
      'Admin',
      'Support',
    ]);
  });

  it('lists only the selected member’s categories', () => {
    component.filter.set({ userId: 'u2' });
    expect(component.categories()).toEqual(['Support']);
  });

  it('reloads entries when the route projectId changes', async () => {
    component.filter.set({ userId: 'u2' });
    paramMap$.next(convertToParamMap({ projectId: 'beta' }));
    await fixture.whenStable();

    expect(component.projectId()).toBe('beta');
    expect(component.filter()).toEqual({});
    expect(component.entries().map((e) => e.id)).toEqual(['b1']);
    expect(findByProjectId).toHaveBeenCalledWith(['beta']);
  });
});
