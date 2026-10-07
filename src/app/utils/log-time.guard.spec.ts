import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';

import { appstraxAuth } from '@appstrax/services/auth';

import { UserRole } from '@models';
import { ToastService } from '@services';
import { Store } from '@state';

import { LogTimeGuard } from './log-time.guard';

describe('LogTimeGuard', () => {
  let guard: LogTimeGuard;
  let refresh: jasmine.Spy;
  let navigate: jasmine.Spy;
  let router: Router;
  let lastGood: jasmine.Spy;
  let toastWarning: jasmine.Spy;

  const urlOf = (result: boolean | UrlTree) =>
    result instanceof UrlTree ? router.serializeUrl(result) : result;

  function setup(
    memberships: Record<string, string>,
    roles: string[] = [UserRole.USER],
  ) {
    refresh = jasmine.createSpy('refresh').and.resolveTo(memberships);
    lastGood = jasmine.createSpy('memberships').and.returnValue({});
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
      ],
    });
    router = TestBed.inject(Router);
    navigate = spyOn(router, 'navigate');
    toastWarning = spyOn(TestBed.inject(ToastService), 'warning');
    guard = TestBed.inject(LogTimeGuard);
  }

  it('allows a contributor', async () => {
    setup({ p1: 'contributor' });
    expect(await guard.canActivate()).toBeTrue();
    expect(navigate).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledWith('u1');
    expect(toastWarning).not.toHaveBeenCalled();
  });

  it('denies a viewer-only user and redirects to analytics', async () => {
    setup({ p1: 'viewer' });
    expect(urlOf(await guard.canActivate())).toBe('/analytics');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('denies an approver-only user', async () => {
    setup({ p1: 'approver' });
    expect(urlOf(await guard.canActivate())).toBe('/analytics');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('allows a user with no memberships', async () => {
    setup({});
    expect(await guard.canActivate()).toBeTrue();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('allows a mixed-role user', async () => {
    setup({ p1: 'viewer', p2: 'contributor' });
    expect(await guard.canActivate()).toBeTrue();
  });

  it('allows a platform admin even with only viewer memberships', async () => {
    setup({ p1: 'viewer' }, [UserRole.ADMIN]);
    expect(await guard.canActivate()).toBeTrue();
  });

  it('refreshes on every activation', async () => {
    setup({ p1: 'contributor' });
    await guard.canActivate();
    await guard.canActivate();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('denies and navigates to login when the user cannot be resolved', async () => {
    setup({ p1: 'contributor' });
    (appstraxAuth.getUser as jasmine.Spy).and.rejectWith(new Error('no'));
    expect(urlOf(await guard.canActivate())).toBe('/login');
    expect(navigate).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('denies and navigates to login when there is no user', async () => {
    setup({ p1: 'contributor' });
    (appstraxAuth.getUser as jasmine.Spy).and.resolveTo(undefined);
    expect(urlOf(await guard.canActivate())).toBe('/login');
    expect(navigate).not.toHaveBeenCalled();
  });

  describe('when the membership refresh fails', () => {
    beforeEach(() => {
      setup({});
      refresh.and.rejectWith(new Error('boom'));
      spyOn(console, 'error');
    });

    it('fails open with no previous memberships and never navigates to root', async () => {
      expect(await guard.canActivate()).toBeTrue();
      expect(navigate).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      expect(toastWarning).toHaveBeenCalledOnceWith(
        "Couldn't refresh your permissions. Using your last known access.",
      );
    });

    it('falls back to the last good memberships', async () => {
      lastGood.and.returnValue({ p1: 'viewer' });
      expect(urlOf(await guard.canActivate())).toBe('/analytics');
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
