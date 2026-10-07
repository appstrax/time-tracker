import { Project, ProjectUserRole } from '@models';

export type ProjectMemberships = Readonly<Record<string, string>>;

export interface ProjectPermissions {
  logTime: boolean;
  viewAnalytics: boolean;
  approve: boolean;
}

const NONE: ProjectPermissions = {
  logTime: false,
  viewAnalytics: false,
  approve: false,
};

/** A `Map`, not an object, so role strings like `'toString'` can't hit a prototype key. */
const PERMISSIONS_BY_ROLE = new Map<string, ProjectPermissions>([
  [ProjectUserRole.ADMIN, { logTime: true, viewAnalytics: false, approve: false }],
  [ProjectUserRole.CONTRIBUTOR, { logTime: true, viewAnalytics: false, approve: false }],
  [ProjectUserRole.VIEWER, { logTime: false, viewAnalytics: true, approve: false }],
  [ProjectUserRole.APPROVER, { logTime: false, viewAnalytics: true, approve: true }],
]);

/**
 * What a user may do on one project. `role` is their project role (`undefined`
 * when not a member). A platform admin sees and approves everything but, as
 * before, only logs time on projects they are a member of.
 */
export function resolveProjectPermissions(
  role: string | undefined,
  platformAdmin: boolean,
): ProjectPermissions {
  if (platformAdmin) {
    return { logTime: role !== undefined, viewAnalytics: true, approve: true };
  }
  return (role !== undefined && PERMISSIONS_BY_ROLE.get(role)) || NONE;
}

export function roleOf(
  memberships: ProjectMemberships,
  projectId: string,
): string | undefined {
  return Object.hasOwn(memberships, projectId) ? memberships[projectId] : undefined;
}

export function filterProjectsByPermission(
  projects: Project[],
  memberships: ProjectMemberships,
  platformAdmin: boolean,
  permission: keyof ProjectPermissions,
): Project[] {
  return projects.filter(
    (project) =>
      resolveProjectPermissions(roleOf(memberships, project.id), platformAdmin)[
        permission
      ],
  );
}

/** Whether any membership (or platform admin status) grants analytics. */
export function hasAnalyticsAccess(
  memberships: ProjectMemberships,
  platformAdmin: boolean,
): boolean {
  return (
    platformAdmin ||
    Object.values(memberships).some(
      (role) => resolveProjectPermissions(role, false).viewAnalytics,
    )
  );
}

/** Viewer/approver-only users have nothing to log, so they start on analytics. */
export function needsAnalyticsLanding(
  memberships: ProjectMemberships,
  platformAdmin: boolean,
): boolean {
  if (platformAdmin) return false;
  return (
    hasAnalyticsAccess(memberships, false) &&
    !Object.values(memberships).some(
      (role) => resolveProjectPermissions(role, false).logTime,
    )
  );
}
