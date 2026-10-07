import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

import { appstraxAuth } from '@appstrax/services/auth';

import { ToastService } from '@services';
import { UserRole } from '@models';
import { Store } from '@state';

import { AnalyticsGuard } from './analytics.guard';

describe('AnalyticsGuard', () => {
  let guard: AnalyticsGuard;
  let refresh: jasmine.Spy;
  let navigate: jasmine.Spy;
  let lastGood: jasmine.Spy;
  let toastError: jasmine.Spy;

  function setup(
    memberships: Record<string, string>,
    roles: string[] = [UserRole.USER],
  ) {
    refresh = jasmine.createSpy('refresh').and.resolveTo(memberships);
    navigate = jasmine.createSpy('navigate');
    lastGood = jasmine.createSpy('memberships').and.returnValue({});
    toastError = jasmine.createSpy('error');
    spyOn(appstraxAuth, 'getUser').and.resolveTo({ id: 'u1', roles } as any);
    TestBed.configureTestingModule({
      providers: [
        { provide: Store, useValue: { access: { refresh, memberships: lastGood } } },
        { provide: Router, useValue: { navigate } },
        { provide: ToastService, useValue: { error: toastError } },
      ],
    });
    guard = TestBed.inject(AnalyticsGuard);
  }

  const route = (projectId?: string) =>
    ({ paramMap: { get: (k: string) => (k === 'projectId' ? (projectId ?? null) : null) } }) as unknown as ActivatedRouteSnapshot;

  it('allows a viewer on their own project', async () => {
    setup({ p1: 'viewer' });
    expect(await guard.canActivate(route('p1'))).toBeTrue();
    expect(navigate).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('denies a contributor-only project with toast and redirect home', async () => {
    setup({ p1: 'contributor' });
    expect(await guard.canActivate(route('p1'))).toBeFalse();
    expect(toastError).toHaveBeenCalledWith('You do not have access to that project');
    expect(navigate).toHaveBeenCalledWith(['/home']);
  });

  it('denies a project the user is not a member of', async () => {
    setup({ p1: 'viewer' });
    expect(await guard.canActivate(route('p2'))).toBeFalse();
    expect(toastError).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/analytics']);
  });

  it('allows a platform admin anywhere', async () => {
    setup({}, [UserRole.ADMIN]);
    expect(await guard.canActivate(route('anything'))).toBeTrue();
    expect(await guard.canActivate(route())).toBeTrue();
  });

  it('allows the list when any membership grants analytics', async () => {
    setup({ p1: 'contributor', p2: 'approver' });
    expect(await guard.canActivate(route())).toBeTrue();
  });

  it('denies the list for contributor-only without a toast', async () => {
    setup({ p1: 'contributor' });
    expect(await guard.canActivate(route())).toBeFalse();
    expect(toastError).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/home']);
  });

  it('refreshes on every activation', async () => {
    setup({ p1: 'viewer' });
    await guard.canActivate(route('p1'));
    await guard.canActivate(route());
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('denies and navigates to login when the user cannot be resolved', async () => {
    setup({ p1: 'viewer' });
    (appstraxAuth.getUser as jasmine.Spy).and.rejectWith(new Error('no'));
    expect(await guard.canActivate(route('p1'))).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('denies and navigates to login when there is no user', async () => {
    setup({ p1: 'viewer' });
    (appstraxAuth.getUser as jasmine.Spy).and.resolveTo(undefined);
    expect(await guard.canActivate(route())).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('denies an unknown role on the list and on a project, redirecting home', async () => {
    setup({ p1: 'bogus' });
    expect(await guard.canActivate(route())).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/home']);
    navigate.calls.reset();
    expect(await guard.canActivate(route('p1'))).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/home']);
  });

  describe('when the membership refresh fails', () => {
    beforeEach(() => {
      setup({});
      refresh.and.rejectWith(new Error('boom'));
      spyOn(console, 'error');
    });

    it('fails closed to /home with no previous memberships', async () => {
      expect(await guard.canActivate(route())).toBeFalse();
      expect(navigate).toHaveBeenCalledWith(['/home']);
      expect(navigate).not.toHaveBeenCalledWith(['']);
      expect(console.error).toHaveBeenCalled();
    });

    it('uses the last good memberships when there are some', async () => {
      lastGood.and.returnValue({ p1: 'viewer' });
      expect(await guard.canActivate(route('p1'))).toBeTrue();
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
