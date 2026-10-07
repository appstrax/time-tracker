import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree, provideRouter } from '@angular/router';

import { appstraxAuth } from '@appstrax/services/auth';

import { ToastService } from '@services';
import { UserRole } from '@models';
import { Store } from '@state';

import { AnalyticsGuard } from './analytics.guard';

describe('AnalyticsGuard', () => {
  let guard: AnalyticsGuard;
  let refresh: jasmine.Spy;
  let navigate: jasmine.Spy;
  let router: Router;
  let lastGood: jasmine.Spy;
  let toastError: jasmine.Spy;
  let toastWarning: jasmine.Spy;

  const urlOf = (result: boolean | UrlTree) =>
    result instanceof UrlTree ? router.serializeUrl(result) : result;

  function setup(
    memberships: Record<string, string>,
    roles: string[] = [UserRole.USER],
  ) {
    refresh = jasmine.createSpy('refresh').and.resolveTo(memberships);
    lastGood = jasmine.createSpy('memberships').and.returnValue({});
    toastError = jasmine.createSpy('error');
    toastWarning = jasmine.createSpy('warning');
    spyOn(appstraxAuth, 'getUser').and.resolveTo({ id: 'u1', roles } as any);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Store,
          useValue: {
            access: { refresh, memberships: lastGood, claimStaleWarning: () => true },
          },
        },
        provideRouter([]),
        { provide: ToastService, useValue: { error: toastError, warning: toastWarning } },
      ],
    });
    router = TestBed.inject(Router);
    navigate = spyOn(router, 'navigate');
    guard = TestBed.inject(AnalyticsGuard);
  }

  const route = (projectId?: string) =>
    ({ paramMap: { get: (k: string) => (k === 'projectId' ? (projectId ?? null) : null) } }) as unknown as ActivatedRouteSnapshot;

  it('allows a viewer on their own project', async () => {
    setup({ p1: 'viewer' });
    expect(await guard.canActivate(route('p1'))).toBeTrue();
    expect(navigate).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
    expect(toastWarning).not.toHaveBeenCalled();
  });

  it('denies a contributor-only project with toast and redirect home', async () => {
    setup({ p1: 'contributor' });
    expect(urlOf(await guard.canActivate(route('p1')))).toBe('/home');
    expect(toastError).toHaveBeenCalledWith('You do not have access to that project');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('denies a project the user is not a member of', async () => {
    setup({ p1: 'viewer' });
    expect(urlOf(await guard.canActivate(route('p2')))).toBe('/analytics');
    expect(toastError).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
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
    expect(urlOf(await guard.canActivate(route()))).toBe('/home');
    expect(toastError).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
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
    expect(urlOf(await guard.canActivate(route('p1')))).toBe('/login');
    expect(navigate).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('denies and navigates to login when there is no user', async () => {
    setup({ p1: 'viewer' });
    (appstraxAuth.getUser as jasmine.Spy).and.resolveTo(undefined);
    expect(urlOf(await guard.canActivate(route()))).toBe('/login');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('denies an unknown role on the list and on a project, redirecting home', async () => {
    setup({ p1: 'bogus' });
    expect(urlOf(await guard.canActivate(route()))).toBe('/home');
    expect(navigate).not.toHaveBeenCalled();
    navigate.calls.reset();
    expect(urlOf(await guard.canActivate(route('p1')))).toBe('/home');
    expect(navigate).not.toHaveBeenCalled();
  });

  describe('when the membership refresh fails', () => {
    beforeEach(() => {
      setup({});
      refresh.and.rejectWith(new Error('boom'));
      spyOn(console, 'error');
    });

    it('fails closed to /home with no previous memberships', async () => {
      expect(urlOf(await guard.canActivate(route()))).toBe('/home');
      expect(navigate).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      expect(toastWarning).toHaveBeenCalledOnceWith(
        "Couldn't refresh your permissions. Using your last known access.",
      );
    });

    it('uses the last good memberships when there are some', async () => {
      lastGood.and.returnValue({ p1: 'viewer' });
      expect(await guard.canActivate(route('p1'))).toBeTrue();
      expect(navigate).not.toHaveBeenCalled();
      expect(toastWarning).toHaveBeenCalledTimes(1);
    });
  });
});
