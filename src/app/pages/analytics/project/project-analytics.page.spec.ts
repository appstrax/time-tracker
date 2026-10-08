import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { Project, TimeSheetEntry, User } from '@models';
import { AnalyticsEntriesService, ToastService, UsersService } from '@services';
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
  let setBillable: jasmine.Spy<
    (id: string, billable: boolean) => Promise<TimeSheetEntry>
  >;
  let canApprove: boolean;
  let platformAdmin: boolean;

  beforeEach(async () => {
    canApprove = true;
    platformAdmin = false;
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
    setBillable = jasmine
      .createSpy('setBillable')
      .and.callFake(async (id: string, billable: boolean) => {
        const found = [
          makeEntry('e1', 'u1', 'Development'),
          makeEntry('e2', 'u2', 'Support'),
          makeEntry('e3', 'exmember', 'Admin'),
          makeEntry('e4', 'u1', 'Development', 'alpha', false),
        ].find((e) => e.id === id)!;
        found.billable = billable;
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
        platformAdmin: () => platformAdmin,
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
          useValue: { findByProjectIds, setApproved, setBillable },
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

  describe('billable toggle gating', () => {
    it('is false for a non-admin', () => {
      platformAdmin = false;
      expect(component.canToggleBillable()).toBeFalse();
    });

    it('is true for a platform admin', () => {
      platformAdmin = true;
      expect(component.canToggleBillable()).toBeTrue();
    });

    it('does nothing when called by a non-admin', async () => {
      platformAdmin = false;
      const entry = component.entries().find((e) => e.id === 'e1')!;
      await component.toggleBillable(entry);
      expect(setBillable).not.toHaveBeenCalled();
    });

    it('flips the entry billable flag via the service when an admin toggles it', async () => {
      platformAdmin = true;
      const entry = component.entries().find((e) => e.id === 'e1')!;
      expect(entry.billable).toBeTrue();

      await component.toggleBillable(entry);

      expect(setBillable).toHaveBeenCalledOnceWith('e1', false);
      expect(
        component.entries().find((e) => e.id === 'e1')!.billable,
      ).toBeFalse();
    });

    it('shows a success toast when marking an entry billable', async () => {
      platformAdmin = true;
      const toast = TestBed.inject(ToastService);
      spyOn(toast, 'success');
      const entry = component.entries().find((e) => e.id === 'e2')!;
      entry.billable = false;

      await component.toggleBillable(entry);

      expect(toast.success).toHaveBeenCalledWith('Status updated successfully');
    });

    it('shows a success toast when marking an entry non-billable', async () => {
      platformAdmin = true;
      const toast = TestBed.inject(ToastService);
      spyOn(toast, 'success');
      const entry = component.entries().find((e) => e.id === 'e1')!;
      expect(entry.billable).toBeTrue();

      await component.toggleBillable(entry);

      expect(toast.success).toHaveBeenCalledWith('Status updated successfully');
    });

    it('shows an error toast when the update fails', async () => {
      platformAdmin = true;
      setBillable.and.rejectWith(new Error('nope'));
      const toast = TestBed.inject(ToastService);
      spyOn(toast, 'error');
      const entry = component.entries().find((e) => e.id === 'e1')!;

      await component.toggleBillable(entry);

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to update billable status',
      );
    });
  });

  describe('approval gating', () => {
    const buttons = () =>
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll(
          'button.status-action',
        ),
      );

    const approvalGroups = () =>
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '[role="group"][aria-label="Approval status"]',
      );

    const loaded = async () => {
      await fixture.whenStable();
      expect(component.entries().length).toBeGreaterThan(0);
      component.filter.set({});
      // Expand every day so per-entry rows (and their action groups) render.
      if (!component.allExpanded()) component.toggleAll();
      fixture.detectChanges();
      expect(
        (fixture.nativeElement as HTMLElement).querySelectorAll('.entry-hours')
          .length,
      ).toBeGreaterThan(0);
    };

    describe('as a viewer', () => {
      beforeEach(async () => {
        canApprove = false;
        await loaded();
      });

      it('renders no approve or decline buttons but keeps status pills', () => {
        expect(buttons().length).toBe(0);
        expect(approvalGroups().length).toBe(0);
        expect(
          (fixture.nativeElement as HTMLElement).querySelectorAll('.status-pill')
            .length,
        ).toBeGreaterThan(0);
      });

      it('does not save when approval handlers are invoked directly', async () => {
        const approved = component.entries().find((e) => e.approved)!;
        const pending = component.entries().find((e) => !e.approved)!;
        const day = component.days()[0];
        // Positive controls: each call below would save for a manager.
        expect(approved).toBeDefined();
        expect(pending).toBeDefined();
        expect(day.entries.some((e) => !e.approved)).toBeTrue();
        expect(day.entries.some((e) => e.approved)).toBeTrue();
        await component.setApproved(approved, false);
        await component.setApproved(pending, true);
        await component.approveDay(day);
        await component.declineDay(day);
        expect(setApproved).not.toHaveBeenCalled();
      });
    });

    describe('as a manager', () => {
      beforeEach(loaded);

      it('renders approve/decline buttons', () => {
        expect(buttons().length).toBeGreaterThan(0);
        expect(approvalGroups().length).toBeGreaterThan(0);
      });

      it('declines each approved entry of the day once via setApproved', async () => {
        const day = component.days()[0];
        const approvedIds = day.entries.filter((e) => e.approved).map((e) => e.id);
        expect(approvedIds.length).toBeGreaterThan(0);
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

      describe('when some saves fail', () => {
        let toastError: jasmine.Spy;
        const approvedById = () =>
          Object.fromEntries(component.entries().map((e) => [e.id, e.approved]));

        beforeEach(() => {
          toastError = spyOn(TestBed.inject(ToastService), 'error');
          setApproved.and.callFake(async (id: string, approved: boolean) => {
            if (id === 'e2') throw new Error('boom');
            const e = makeEntry(id, 'u1', 'Development');
            e.approved = approved;
            return e;
          });
          findByProjectIds.calls.reset();
        });

        it('refreshes from the server on partial failure and keeps successes', async () => {
          // The server has the two successful declines; e2 is still approved.
          findByProjectIds.and.callFake(async () => [
            makeEntry('e1', 'u1', 'Development', 'alpha', false),
            makeEntry('e2', 'u2', 'Support'),
            makeEntry('e3', 'exmember', 'Admin', 'alpha', false),
            makeEntry('e4', 'u1', 'Development', 'alpha', false),
          ]);
          await component.declineDay(component.days()[0]);

          expect(findByProjectIds).toHaveBeenCalledOnceWith(['alpha']);
          expect(approvedById()).toEqual({ e1: false, e2: true, e3: false, e4: false });
          expect(toastError).toHaveBeenCalledOnceWith(
            '1 of 3 time entries could not be updated. List refreshed from server.',
          );
          expect(component.busy().size).toBe(0);
        });

        it('keeps the local successes when the refresh also fails', async () => {
          findByProjectIds.and.rejectWith(new Error('offline'));
          await component.declineDay(component.days()[0]);

          expect(approvedById()).toEqual({ e1: false, e2: true, e3: false, e4: false });
          expect(toastError).toHaveBeenCalledWith('Failed to refresh time sheet entries');
          expect(toastError).toHaveBeenCalledWith(
            '1 of 3 time entries could not be updated. List refreshed from server.',
          );
        });
      });

      describe('when every save fails', () => {
        let toastError: jasmine.Spy;
        beforeEach(() => {
          toastError = spyOn(TestBed.inject(ToastService), 'error');
        });

        it('shows the server’s message', async () => {
          setApproved.and.rejectWith(
            new HttpErrorResponse({
              status: 403,
              error: { message: 'Your role on this project does not allow approving time' },
            }),
          );
          const pending = component.entries().find((e) => !e.approved)!;
          await component.setApproved(pending, true);
          expect(toastError).toHaveBeenCalledOnceWith(
            'Your role on this project does not allow approving time',
          );
        });

        it('does not surface the message of a non-HTTP error', async () => {
          setApproved.and.rejectWith(new Error('TypeError: internal detail'));
          const pending = component.entries().find((e) => !e.approved)!;
          await component.setApproved(pending, true);
          expect(toastError).toHaveBeenCalledOnceWith('Error updating time entry status');
        });

        it('falls back to a generic message when the error has none', async () => {
          setApproved.and.callFake(() => Promise.reject('nope'));
          const pending = component.entries().find((e) => !e.approved)!;
          await component.setApproved(pending, true);
          expect(toastError).toHaveBeenCalledOnceWith('Error updating time entry status');
        });
      });
    });
  });
});
