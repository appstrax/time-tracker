import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { UserRole } from '@models';
import { ProjectUserService } from '@services';
// Relative, not '@utils': the barrel will hold guards that import '@state'.
import {
  ProjectMemberships,
  ProjectPermissions,
  filterProjectsByPermission,
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
        needsAnalyticsLanding: computed(() =>
          needsAnalyticsLanding(store.memberships(), platformAdmin()),
        ),
      };
    },
  ),
  withMethods((store, projectUsers = inject(ProjectUserService)) => {
    let inFlight: Promise<ProjectMemberships> | null = null;

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
        inFlight ??= (async () => {
          try {
            const rows = await projectUsers.findByUserId(userId);
            const memberships = Object.fromEntries(
              rows.map((row) => [row.projectId, row.role as string]),
            );
            patchState(store, { memberships });
            return memberships;
          } finally {
            inFlight = null;
          }
        })();
        return inFlight;
      },

      clear: () => patchState(store, { memberships: {} }),
    };
  }),
);
