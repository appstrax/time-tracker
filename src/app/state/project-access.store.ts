import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { UserRole } from '@models';
import { ProjectUserService } from '@services';
// Relative, not '@utils': the barrel will hold guards that import '@state'.
import {
  ProjectMemberships,
  ProjectPermissions,
  filterProjectsByPermission,
  hasAnalyticsAccess,
  needsAnalyticsLanding,
  resolveProjectPermissions,
  roleOf,
} from '../utils/project-access.util';

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
    // Keyed by user so one user's pending request is never handed to another;
    // `generation` lets clear() invalidate any request still in flight.
    let inFlight: { userId: string; promise: Promise<ProjectMemberships> } | null = null;
    let generation = 0;

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
        const started = generation;
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
            if (started === generation) patchState(store, { memberships });
            return memberships;
          } finally {
            if (inFlight === entry) inFlight = null;
          }
        })();
        inFlight = entry;
        return entry.promise;
      },

      clear: () => {
        generation++;
        inFlight = null;
        patchState(store, { memberships: {} });
      },
    };
  }),
);
