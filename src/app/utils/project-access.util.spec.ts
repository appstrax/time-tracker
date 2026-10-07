import { Project, ProjectUserRole } from '@models';

import {
  filterProjectsByPermission,
  needsAnalyticsLanding,
  resolveProjectPermissions,
} from './project-access.util';

const project = (id: string): Project => Object.assign(new Project(), { id });

describe('resolveProjectPermissions', () => {
  it('lets a contributor log time only', () => {
    expect(resolveProjectPermissions(ProjectUserRole.CONTRIBUTOR, false)).toEqual(
      { logTime: true, viewAnalytics: false, approve: false },
    );
  });

  it('lets a project admin log time only (label, no extra power)', () => {
    expect(resolveProjectPermissions(ProjectUserRole.ADMIN, false)).toEqual(
      { logTime: true, viewAnalytics: false, approve: false },
    );
  });

  it('lets a viewer view analytics only', () => {
    expect(resolveProjectPermissions(ProjectUserRole.VIEWER, false)).toEqual(
      { logTime: false, viewAnalytics: true, approve: false },
    );
  });

  it('lets an approver view analytics and approve', () => {
    expect(resolveProjectPermissions(ProjectUserRole.APPROVER, false)).toEqual(
      { logTime: false, viewAnalytics: true, approve: true },
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
    c: ProjectUserRole.APPROVER,
  };

  it('keeps only projects whose role grants the permission', () => {
    expect(
      filterProjectsByPermission(projects, memberships, false, 'logTime').map((p) => p.id),
    ).toEqual(['a']);
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
  it('is true for viewer-only and approver-only users', () => {
    expect(needsAnalyticsLanding({ a: ProjectUserRole.VIEWER }, false)).toBeTrue();
    expect(
      needsAnalyticsLanding({ a: ProjectUserRole.VIEWER, b: ProjectUserRole.APPROVER }, false),
    ).toBeTrue();
  });

  it('is false for contributors, mixed-role users, platform admins and users with no memberships', () => {
    expect(needsAnalyticsLanding({ a: ProjectUserRole.CONTRIBUTOR }, false)).toBeFalse();
    expect(
      needsAnalyticsLanding({ a: ProjectUserRole.CONTRIBUTOR, b: ProjectUserRole.VIEWER }, false),
    ).toBeFalse();
    expect(needsAnalyticsLanding({ a: ProjectUserRole.VIEWER }, true)).toBeFalse();
    expect(needsAnalyticsLanding({}, false)).toBeFalse();
  });
});
