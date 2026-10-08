import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { UserRole } from '@models';
import { ProjectUserService } from '@services';
import {
  ProjectMemberships,
  ProjectPermissions,
  filterProjectsByPermission,
  hasAnalyticsAccess,
  needsAnalyticsLanding,
  resolveProjectPermissions,
  roleOf,
} from '@utils';

import { ProjectsStore } from './projects.store';
import { UserStore } from './user.store';

interface ProjectAccessState {
  memberships: ProjectMemberships;
}

export const ProjectAccessStore = signalStore(
  { providedIn: 'root' },
  withState<ProjectAccessState>({ memberships: {} }),
  withComputed(
    (store, user = inject(UserStore), projects = inject(ProjectsStore)) => {
      const platformAdmin = computed(() => user.user()?.role === UserRole.ADMIN);
      const projectsFor = (permission: keyof ProjectPermissions) =>
        computed(() =>
          filterProjectsByPermission(
            projects.projects(),
            store.memberships(),
            platformAdmin(),
            permission,
          ),
        );
      return {
        platformAdmin,
        logProjects: projectsFor('logTime'),
        analyticsProjects: projectsFor('viewAnalytics'),
        hasAnalyticsAccess: computed(() =>
          hasAnalyticsAccess(store.memberships(), platformAdmin()),
        ),
        needsAnalyticsLanding: computed(() =>
          needsAnalyticsLanding(store.memberships(), platformAdmin()),
        ),
      };
    },
  ),
  withMethods((store, projectUsers = inject(ProjectUserService)) => {
    // Keyed by user so one user's pending request is never handed to another.
    // `generation` bumps on every new request and on clear(), so only the
    // latest request may patch state (a late reply for another user can't).
    let inFlight: { userId: string; promise: Promise<ProjectMemberships> } | null = null;
    let generation = 0;
    // The stale-access warning is shown at most once until a refresh succeeds.
    let staleWarningShown = false;

    const sameMemberships = (a: ProjectMemberships, b: ProjectMemberships) => {
      const keys = Object.keys(a);
      return (
        keys.length === Object.keys(b).length &&
        keys.every((key) => Object.hasOwn(b, key) && a[key] === b[key])
      );
    };

    const permissionsFor = (projectId: string) =>
      resolveProjectPermissions(
        roleOf(store.memberships(), projectId),
        store.platformAdmin(),
      );

    return {
      can: (projectId: string, permission: keyof ProjectPermissions) =>
        permissionsFor(projectId)[permission],

      /** A member of the project whose role does not let them log time on it. */
      isLogRestricted: (projectId: string) =>
        roleOf(store.memberships(), projectId) !== undefined &&
        !store.platformAdmin() &&
        !permissionsFor(projectId).logTime,

      /** Always refetches so role changes apply without a re-login. */
      refresh(userId: string): Promise<ProjectMemberships> {
        if (inFlight?.userId === userId) return inFlight.promise;
        const started = ++generation;
        const entry = { userId, promise: undefined as unknown as Promise<ProjectMemberships> };
        entry.promise = (async () => {
          try {
            const rows = await projectUsers.findByUserId(userId);
            // First row wins when a project has duplicate rows (same as the API).
            const memberships: Record<string, string> = {};
            for (const row of rows) {
              if (!Object.hasOwn(memberships, row.projectId)) {
                memberships[row.projectId] = row.role as string;
              }
            }
            // Skip unchanged maps so derived project lists keep their identity.
            if (
              started === generation &&
              !sameMemberships(memberships, store.memberships())
            ) {
              patchState(store, { memberships });
            }
            if (started === generation) staleWarningShown = false;
            return memberships;
          } catch (error) {
            // Fail closed: a role may have just been revoked, so a failed
            // refresh must not leave a stale, possibly over-privileged
            // membership set in place. Every permission check reads
            // store.memberships(), so clearing it here denies logTime,
            // viewAnalytics and approve everywhere until a refresh succeeds.
            if (started === generation && !sameMemberships({}, store.memberships())) {
              patchState(store, { memberships: {} });
            }
            throw error;
          } finally {
            if (inFlight === entry) inFlight = null;
          }
        })();
        inFlight = entry;
        return entry.promise;
      },

      /** True the first time after a successful refresh (or clear()); false after. */
      claimStaleWarning(): boolean {
        if (staleWarningShown) return false;
        staleWarningShown = true;
        return true;
      },

      clear: () => {
        generation++;
        staleWarningShown = false;
        inFlight = null;
        patchState(store, { memberships: {} });
      },
    };
  }),
);
