import { Project, ProjectUserRole } from '@models';

import {
  filterProjectsByPermission,
  hasAnalyticsAccess,
  needsAnalyticsLanding,
  resolveProjectPermissions,
  roleOf,
} from './project-access.util';

const project = (id: string): Project => Object.assign(new Project(), { id });

describe('resolveProjectPermissions', () => {
  it('lets a contributor log time only', () => {
    expect(resolveProjectPermissions(ProjectUserRole.CONTRIBUTOR, false)).toEqual(
      { logTime: true, viewAnalytics: false, approve: false },
    );
  });

  it('lets a viewer view analytics only', () => {
    expect(resolveProjectPermissions(ProjectUserRole.VIEWER, false)).toEqual(
      { logTime: false, viewAnalytics: true, approve: false },
    );
  });

  it('lets a manager log time, view analytics and approve', () => {
    expect(resolveProjectPermissions(ProjectUserRole.MANAGER, false)).toEqual(
      { logTime: true, viewAnalytics: true, approve: true },
    );
  });

  it('grants nothing for missing, empty or unrecognised roles', () => {
    const none = { logTime: false, viewAnalytics: false, approve: false };
    for (const role of [undefined, '', 'owner', 'toString', 'constructor']) {
      expect(resolveProjectPermissions(role, false)).toEqual(none);
    }
  });

  it('gives a platform admin analytics and approval everywhere, log time only as a member', () => {
    expect(resolveProjectPermissions(undefined, true)).toEqual(
      { logTime: false, viewAnalytics: true, approve: true },
    );
    expect(resolveProjectPermissions(ProjectUserRole.VIEWER, true)).toEqual(
      { logTime: true, viewAnalytics: true, approve: true },
    );
  });
});

describe('filterProjectsByPermission', () => {
  const projects = [project('a'), project('b'), project('c')];
  const memberships = {
    a: ProjectUserRole.CONTRIBUTOR,
    b: ProjectUserRole.VIEWER,
    c: ProjectUserRole.MANAGER,
  };

  it('keeps only projects whose role grants the permission', () => {
    expect(
      filterProjectsByPermission(projects, memberships, false, 'logTime').map((p) => p.id),
    ).toEqual(['a', 'c']);
    expect(
      filterProjectsByPermission(projects, memberships, false, 'viewAnalytics').map((p) => p.id),
    ).toEqual(['b', 'c']);
    expect(
      filterProjectsByPermission(projects, memberships, false, 'approve').map((p) => p.id),
    ).toEqual(['c']);
  });

  it('returns every project for a platform admin analytics list, member projects for log time', () => {
    expect(
      filterProjectsByPermission(projects, { a: ProjectUserRole.VIEWER }, true, 'viewAnalytics'),
    ).toHaveSize(3);
    expect(
      filterProjectsByPermission(projects, { a: ProjectUserRole.VIEWER }, true, 'logTime').map((p) => p.id),
    ).toEqual(['a']);
  });
});

describe('needsAnalyticsLanding', () => {
  it('is true for viewer-only users', () => {
    expect(needsAnalyticsLanding({ a: ProjectUserRole.VIEWER }, false)).toBeTrue();
  });

  it('is false for contributors, managers, mixed-role users, platform admins and users with no memberships', () => {
    expect(needsAnalyticsLanding({ a: ProjectUserRole.CONTRIBUTOR }, false)).toBeFalse();
    expect(needsAnalyticsLanding({ a: ProjectUserRole.MANAGER }, false)).toBeFalse();
    expect(
      needsAnalyticsLanding({ a: ProjectUserRole.VIEWER, b: ProjectUserRole.MANAGER }, false),
    ).toBeFalse();
    expect(
      needsAnalyticsLanding({ a: ProjectUserRole.CONTRIBUTOR, b: ProjectUserRole.VIEWER }, false),
    ).toBeFalse();
    expect(needsAnalyticsLanding({ a: ProjectUserRole.VIEWER }, true)).toBeFalse();
    expect(needsAnalyticsLanding({}, false)).toBeFalse();
  });
});

describe('unknown and missing roles', () => {
  it('resolves an empty role (row with no role) to no access', () => {
    expect(resolveProjectPermissions('', false)).toEqual({
      logTime: false,
      viewAnalytics: false,
      approve: false,
    });
  });

  it('does not send an unknown-role user to the analytics landing', () => {
    expect(needsAnalyticsLanding({ a: 'bogus' }, false)).toBeFalse();
  });

  it('gives an unknown-role user no analytics access', () => {
    expect(hasAnalyticsAccess({ a: 'bogus' }, false)).toBeFalse();
  });
});

describe('hasAnalyticsAccess', () => {
  it('is true for a platform admin with no memberships', () => {
    expect(hasAnalyticsAccess({}, true)).toBeTrue();
  });

  it('is true for viewer and manager memberships', () => {
    expect(hasAnalyticsAccess({ a: 'viewer' }, false)).toBeTrue();
    expect(hasAnalyticsAccess({ a: 'manager' }, false)).toBeTrue();
  });

  it('is false for contributor-only and empty memberships', () => {
    expect(hasAnalyticsAccess({ a: 'contributor' }, false)).toBeFalse();
    expect(hasAnalyticsAccess({}, false)).toBeFalse();
  });
});

describe('roleOf', () => {
  it('returns the role for a member project', () => {
    expect(roleOf({ a: 'viewer' }, 'a')).toBe('viewer');
  });

  it('returns undefined for prototype-key project ids', () => {
    expect(roleOf({ a: 'viewer' }, 'toString')).toBeUndefined();
    expect(roleOf({ a: 'viewer' }, '__proto__')).toBeUndefined();
  });
});
