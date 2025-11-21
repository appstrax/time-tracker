import { computed, inject } from '@angular/core';

import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';

import { Organization, ProjectUsers } from '@models';
import { ProjectUsersService } from '@services';
import { EntityState, createEmptyEntityState, upsertMany, upsertOne, removeOne } from '@state';
import { FetchQuery } from '@appstrax/services';
import { FindResultDto } from '@appstrax/services/database';

interface ProjectUsersState extends EntityState<ProjectUsers> {}

export const ProjectUsersStore = signalStore(
  { providedIn: 'root' },
  withState<ProjectUsersState>(createEmptyEntityState<ProjectUsers>()),
  withComputed((store) => ({
    all: computed(() => store.ids().map((id) => store.entities()[id])),
    count: computed(() => store.ids().length),
  })),
  withMethods((store, projUsersService = inject(ProjectUsersService)) => ({
    async loadForUser(userId: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const res = await projUsersService.find({ where: { userId: userId } });
        const items = res.data as ProjectUsers[];
        const next = createEmptyEntityState<ProjectUsers>();
        const updated = upsertMany(next, items);
        patchState(store, updated);
      } catch (e: any) {
        patchState(store, { error: e?.message ?? 'Failed to load project users' });
      } finally {
        patchState(store, { loading: false });
      }
    },
    byProjectId(projectId: string) {
      return computed(() =>
        store
          .ids()
          .map((id) => store.entities()[id])
          .filter((x) => x.projectId === projectId)
      );
    },
    byUserId(userId: string) {
      return computed(() =>
        store
          .ids()
          .map((id) => store.entities()[id])
          .filter((x) => x.userId === userId)
      );
    },
    replaceAll(items: ProjectUsers[]) {
      const next = createEmptyEntityState<ProjectUsers>();
      const updated = upsertMany(next, items);
      patchState(store, updated);
    },
    upsertMany(items: ProjectUsers[]) {
      patchState(store, (state) => upsertMany(state, items));
    },
    upsertOne(item: ProjectUsers) {
      patchState(store, (state) => upsertOne(state, item));
    },
    removeOne(id: string) {
      patchState(store, (state) => removeOne(state, id));
    },
    clear() {
      patchState(store, createEmptyEntityState<ProjectUsers>());
    },
    setLoading(loading: boolean) {
      patchState(store, { loading });
    },
    setError(error: string | null) {
      patchState(store, { error });
    },
    async find(query?: FetchQuery): Promise<FindResultDto<ProjectUsers>> {
      const res = await projUsersService.find(query);
      patchState(store, (state) => upsertMany(state, res.data ?? []));
      return res;
    },
    async findById(id: string): Promise<ProjectUsers> {
      const res = await projUsersService.findById(id);
      patchState(store, (state) => upsertOne(state, res));
      return res;
    },
    async save(entity: ProjectUsers): Promise<ProjectUsers> {
      const res = await projUsersService.save(entity);
      patchState(store, (state) => upsertOne(state, res));
      return res;
    },
    async delete(id: string): Promise<void> {
      await projUsersService.delete(id);
      patchState(store, (state) => removeOne(state, id));
    },
  }))
);


