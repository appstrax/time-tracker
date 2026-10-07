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
  let save: jasmine.Spy<(entry: TimeSheetEntry) => Promise<TimeSheetEntry>>;
  let canApprove: boolean;

  beforeEach(async () => {
    canApprove = true;
    save = jasmine
      .createSpy('save')
      .and.callFake(async (entry: TimeSheetEntry) => entry);
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
      access: {
        analyticsProjects: signal<Project[]>([alpha]),
        can: (_projectId: string, action: string) =>
          action === 'approve' && canApprove,
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
          useValue: { findByProjectId, save },
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

  describe('approval gating', () => {
    const buttons = () =>
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll(
          'button.status-action',
        ),
      );

    const loaded = async () => {
      while (component.loading() || !component.entries().length) {
        await new Promise((resolve) => setTimeout(resolve));
      }
      component.filter.set({});
      fixture.detectChanges();
    };

    describe('as a viewer', () => {
      beforeEach(async () => {
        canApprove = false;
        await loaded();
      });

      it('renders no approve or decline buttons but keeps status pills', () => {
        expect(buttons().length).toBe(0);
        expect(
          (fixture.nativeElement as HTMLElement).querySelectorAll('.status-pill')
            .length,
        ).toBeGreaterThan(0);
      });

      it('does not save when approval handlers are invoked directly', async () => {
        const [first] = component.entries();
        const day = component.days()[0];
        await component.setApproved(first, false);
        await component.approveDay(day);
        await component.declineDay(day);
        expect(save).not.toHaveBeenCalled();
      });
    });

    describe('as an approver', () => {
      beforeEach(loaded);

      it('renders approve/decline buttons', () => {
        expect(buttons().length).toBeGreaterThan(0);
      });

      it('saves each entry once with only approved changed', async () => {
        const day = component.days()[0];
        const originals = day.entries.map((e) => ({ ...e.clone() }));
        await component.declineDay(day);

        expect(save).toHaveBeenCalledTimes(originals.length);
        const saved = save.calls.allArgs().map(([e]) => e);
        for (const original of originals) {
          const after = saved.find((e) => e.id === original.id)!;
          expect(after.approved).toBe(false);
          expect({ ...after, approved: true }).toEqual(original);
        }
      });
    });

    it('shows the buttons for a platform admin (can() true)', async () => {
      canApprove = true;
      await loaded();
      expect(buttons().length).toBeGreaterThan(0);
    });
  });
});
