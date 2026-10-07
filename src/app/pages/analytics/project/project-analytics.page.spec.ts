import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { Project, TimeSheetEntry, User } from '@models';
import { AnalyticsEntriesService, UsersService } from '@services';
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
  approved = true,
): TimeSheetEntry {
  const entry = new TimeSheetEntry();
  entry.id = id;
  entry.projectId = projectId;
  entry.userId = userId;
  entry.category = category;
  entry.hours = 1;
  entry.date = new Date(2026, 0, 15);
  entry.approved = approved;
  return entry;
}

describe('ProjectAnalyticsPage', () => {
  let component: ProjectAnalyticsPage;
  let fixture: ComponentFixture<ProjectAnalyticsPage>;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let findByProjectIds: jasmine.Spy<
    (ids: string[]) => Promise<TimeSheetEntry[]>
  >;
  let setApproved: jasmine.Spy<
    (id: string, approved: boolean) => Promise<TimeSheetEntry>
  >;
  let canApprove: boolean;

  beforeEach(async () => {
    canApprove = true;
    setApproved = jasmine
      .createSpy('setApproved')
      .and.callFake(async (id: string, approved: boolean) => {
        const found = [
          makeEntry('e1', 'u1', 'Development'),
          makeEntry('e2', 'u2', 'Support'),
          makeEntry('e3', 'exmember', 'Admin'),
          makeEntry('e4', 'u1', 'Development', 'alpha', false),
        ].find((e) => e.id === id)!;
        found.approved = approved;
        return found;
      });
    paramMap$ = new BehaviorSubject(convertToParamMap({ projectId: 'alpha' }));
    findByProjectIds = jasmine
      .createSpy('findByProjectIds')
      .and.callFake(async (ids: string[]) => {
        const projectId = ids[0];
        if (projectId === 'beta') {
          return [makeEntry('b1', 'u1', 'Development', 'beta')];
        }
        return [
          makeEntry('e1', 'u1', 'Development'),
          makeEntry('e2', 'u2', 'Support'),
          makeEntry('e3', 'exmember', 'Admin'),
          makeEntry('e4', 'u1', 'Development', 'alpha', false),
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
          provide: AnalyticsEntriesService,
          useValue: { findByProjectIds, setApproved },
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
    expect(findByProjectIds).toHaveBeenCalledWith(['beta']);
  });

  describe('approval gating', () => {
    const buttons = () =>
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll(
          'button.status-action',
        ),
      );

    const loaded = async () => {
      await fixture.whenStable();
      expect(component.entries().length).toBeGreaterThan(0);
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
        // Positive control: the day has pending entries approveDay would save.
        expect(day.entries.some((e) => !e.approved)).toBeTrue();
        expect(day.entries.some((e) => e.approved)).toBeTrue();
        await component.setApproved(first, false);
        await component.approveDay(day);
        await component.declineDay(day);
        expect(setApproved).not.toHaveBeenCalled();
      });
    });

    describe('as an approver', () => {
      beforeEach(loaded);

      it('renders approve/decline buttons', () => {
        expect(buttons().length).toBeGreaterThan(0);
      });

      it('approves each entry once via setApproved', async () => {
        const day = component.days()[0];
        const approvedIds = day.entries.filter((e) => e.approved).map((e) => e.id);
        await component.declineDay(day);

        expect(setApproved).toHaveBeenCalledTimes(approvedIds.length);
        for (const id of approvedIds) {
          expect(setApproved).toHaveBeenCalledWith(id, false);
          expect(component.entries().find((e) => e.id === id)!.approved).toBeFalse();
        }
      });

      it('approves pending entries with approved=true', async () => {
        const day = component.days()[0];
        await component.approveDay(day);
        expect(setApproved).toHaveBeenCalledWith('e4', true);
        expect(component.entries().find((e) => e.id === 'e4')!.approved).toBeTrue();
      });

      it('refreshes from the server on partial failure and keeps successes', async () => {
        setApproved.and.callFake(async (id: string, approved: boolean) => {
          if (id === 'e2') throw new Error('boom');
          const e = makeEntry(id, 'u1', 'Development');
          e.approved = approved;
          return e;
        });
        findByProjectIds.calls.reset();
        await component.declineDay(component.days()[0]);

        expect(findByProjectIds).toHaveBeenCalledOnceWith(['alpha']);
        expect(component.busy().size).toBe(0);
      });
    });
  });
});
