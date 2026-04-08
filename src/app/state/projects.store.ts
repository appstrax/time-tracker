import { inject } from '@angular/core';

import { patchState } from '@ngrx/signals';
import { signalStore, withState, withMethods } from '@ngrx/signals';

import { Project } from '@models';
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
  withMethods((store, projectService = inject(ProjectService)) => ({
    async fetchUserProjects(userId: string): Promise<void> {
      if (!userId) return;
      patchState(store, { loading: true });
      try {
        const projects = await projectService.findByUserId(userId);

        patchState(store, {
          projects,
          fetchedAt: new Date(),
        });
      } catch (e: any) {
        patchState(store, { fetchedAt: new Date() });
      } finally {
        patchState(store, { loading: false });
      }
    },
  })),
);
