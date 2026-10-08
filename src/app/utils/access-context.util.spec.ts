import { inject, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter } from '@angular/router';

import { appstraxAuth } from '@appstrax/services/auth';

import { ProjectUser, ProjectUserRole, User, UserRole } from '@models';
import { ProjectUserService, ToastService } from '@services';
import { ProjectAccessStore, ProjectsStore, Store, UserStore } from '@state';

import { STALE_ACCESS_MESSAGE, loadAccessContext } from './access-context.util';
import { AnalyticsGuard } from './analytics.guard';
import { LogTimeGuard } from './log-time.guard';

describe('loadAccessContext stale-access warning', () => {
  let findByUserId: jasmine.Spy;
  let warning: jasmine.Spy;
  let store: Store;
  let toast: ToastService;

  const contributorRow = () => {
    const row = new ProjectUser();
    row.projectId = 'p1';
    row.userId = 'u1';
    row.role = ProjectUserRole.CONTRIBUTOR;
    return [row];
  };

  beforeEach(() => {
    findByUserId = jasmine.createSpy('findByUserId').and.rejectWith(new Error('down'));
    spyOn(appstraxAuth, 'getUser').and.resolveTo({ id: 'u1', roles: [UserRole.USER] } as any);
    spyOn(console, 'error');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ProjectUserService, useValue: { findByUserId } },
        { provide: UserStore, useValue: { user: signal<User | null>(null) } },
        { provide: ProjectsStore, useValue: { projects: signal([]) } },
        // Real access store, so the "shown once" flag is exercised end to end.
        { provide: Store, useFactory: () => ({ access: inject(ProjectAccessStore) }) },
      ],
    });
    store = TestBed.inject(Store);
    toast = TestBed.inject(ToastService);
    warning = spyOn(toast, 'warning');
  });

  it('warns once across consecutive failed refreshes', async () => {
    await loadAccessContext(store, toast);
    await loadAccessContext(store, toast);
    expect(warning).toHaveBeenCalledOnceWith(STALE_ACCESS_MESSAGE);
  });

  it('warns again after a success followed by a new failure', async () => {
    await loadAccessContext(store, toast);
    findByUserId.and.callFake(async () => contributorRow());
    await loadAccessContext(store, toast);
    expect(warning).toHaveBeenCalledTimes(1);
    findByUserId.and.rejectWith(new Error('down again'));
    await loadAccessContext(store, toast);
    expect(warning).toHaveBeenCalledTimes(2);
  });

  it('warns once when AnalyticsGuard and then LogTimeGuard run on one click', async () => {
    const route = { paramMap: { get: () => null } } as unknown as ActivatedRouteSnapshot;
    await TestBed.inject(AnalyticsGuard).canActivate(route);
    await TestBed.inject(LogTimeGuard).canActivate();
    expect(warning).toHaveBeenCalledOnceWith(STALE_ACCESS_MESSAGE);
  });
});
