import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { appstraxAuth } from '@appstrax/services/auth';

import { UserRole } from '@models';
import { Store } from '@state';

import { LogTimeGuard } from './log-time.guard';

describe('LogTimeGuard', () => {
  let guard: LogTimeGuard;
  let refresh: jasmine.Spy;
  let navigate: jasmine.Spy;
  let lastGood: jasmine.Spy;

  function setup(
    memberships: Record<string, string>,
    roles: string[] = [UserRole.USER],
  ) {
    refresh = jasmine.createSpy('refresh').and.resolveTo(memberships);
    navigate = jasmine.createSpy('navigate');
    lastGood = jasmine.createSpy('memberships').and.returnValue({});
    spyOn(appstraxAuth, 'getUser').and.resolveTo({ id: 'u1', roles } as any);
    TestBed.configureTestingModule({
      providers: [
        { provide: Store, useValue: { access: { refresh, memberships: lastGood } } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    guard = TestBed.inject(LogTimeGuard);
  }

  it('allows a contributor', async () => {
    setup({ p1: 'contributor' });
    expect(await guard.canActivate()).toBeTrue();
    expect(navigate).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledWith('u1');
  });

  it('denies a viewer-only user and redirects to analytics', async () => {
    setup({ p1: 'viewer' });
    expect(await guard.canActivate()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/analytics']);
  });

  it('denies an approver-only user', async () => {
    setup({ p1: 'approver' });
    expect(await guard.canActivate()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/analytics']);
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
    expect(await guard.canActivate()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('denies and navigates to login when there is no user', async () => {
    setup({ p1: 'contributor' });
    (appstraxAuth.getUser as jasmine.Spy).and.resolveTo(undefined);
    expect(await guard.canActivate()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/login']);
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
    });

    it('falls back to the last good memberships', async () => {
      lastGood.and.returnValue({ p1: 'viewer' });
      expect(await guard.canActivate()).toBeFalse();
      expect(navigate).toHaveBeenCalledWith(['/analytics']);
      expect(navigate).not.toHaveBeenCalledWith(['']);
    });
  });
});
