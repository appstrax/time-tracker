import { computed, inject } from '@angular/core';

import { withComputed, patchState } from '@ngrx/signals';
import { signalStore, withState, withMethods } from '@ngrx/signals';

import { Operator } from '@appstrax/services/database';

import { Project } from '@models';
import { ProjectService } from '@services';
import { upsertOne, removeOne, upsertMany } from '@state';
import { EntityState, createEmptyEntityState } from '@state';

interface ProjectsState extends EntityState<Project> {}

export const ProjectsStore = signalStore(
  { providedIn: 'root' },
  withState<ProjectsState>(createEmptyEntityState<Project>()),
  withComputed((store) => ({
    all: computed(() => store.ids().map((id) => store.entities()[id])),
    count: computed(() => store.ids().length),
  })),
  withMethods((store, projectService = inject(ProjectService)) => ({
    async loadByIds(ids: string[]): Promise<void> {
      if (!ids || ids.length === 0) return;
      patchState(store, { loading: true, error: null });
      try {
        const res = await projectService.find({
          where: { id: { [Operator.IN]: Array.from(new Set(ids)) } },
        });
        const projects = (res.data ?? []) as Project[];
        patchState(store, (state) => upsertMany(state, projects));
      } catch (e: any) {
        patchState(store, { error: e?.message ?? 'Failed to load projects' });
      } finally {
        patchState(store, { loading: false });
      }
    },
    replaceAll(projects: Project[]) {
      const next = createEmptyEntityState<Project>();
      const updated = upsertMany(next, projects);
      patchState(store, updated);
    },
    upsertMany(projects: Project[]) {
      patchState(store, (state) => upsertMany(state, projects));
    },
    upsertOne(project: Project) {
      patchState(store, (state) => upsertOne(state, project));
    },
    removeOne(id: string) {
      patchState(store, (state) => removeOne(state, id));
    },
    clear() {
      patchState(store, createEmptyEntityState<Project>());
    },
    setLoading(loading: boolean) {
      patchState(store, { loading });
    },
    setError(error: string | null) {
      patchState(store, { error });
    },
  }))
);
