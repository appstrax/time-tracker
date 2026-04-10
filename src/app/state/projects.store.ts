import { inject } from '@angular/core';

import { patchState } from '@ngrx/signals';
import { signalStore, withState, withMethods } from '@ngrx/signals';

import { Project, User, UserRole } from '@models';
import { ProjectService } from '@services';

interface ProjectsState {
  projects: Project[];
  fetchedAt: Date | null;
  loading: boolean;
}

const initialState: ProjectsState = {
  projects: [],
  fetchedAt: null,
  loading: false,
};

export const ProjectsStore = signalStore(
  { providedIn: 'root' },
  withState<ProjectsState>(initialState),
  withMethods((store, projectService = inject(ProjectService)) => {
    let inFlightFetch: Promise<void> | null = null;

    return {
      async fetchUserProjects(user: User): Promise<void> {
        if (!user?.id) return;

        if (inFlightFetch) return inFlightFetch;

        inFlightFetch = (async () => {
          patchState(store, { loading: true });

          try {
            let projects: Project[] = [];
            if (user.role === UserRole.ADMIN) {
              projects = await projectService.findAll();
            } else {
              projects = await projectService.findByUserId(user.id);
            }

            patchState(store, {
              projects: projects.sort((a, b) => a.name.localeCompare(b.name)),
              fetchedAt: new Date(),
            });
          } catch (e: any) {
            patchState(store, { fetchedAt: new Date() });
            throw e;
          } finally {
            patchState(store, { loading: false });
            inFlightFetch = null;
          }
        })();

        return inFlightFetch;
      },
    };
  }),
);
