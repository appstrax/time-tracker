import { computed, inject } from '@angular/core';

import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';

import { FetchQuery, FindResultDto, Operator } from '@appstrax/services/database';

import { OrganizationProjects } from '@models';
import { OrganizationProjectsService } from '@services';
import { EntityState, createEmptyEntityState, upsertMany, upsertOne, removeOne } from '@state';

interface OrganizationProjectsState extends EntityState<OrganizationProjects> {}

export const OrganizationProjectsStore = signalStore(
  { providedIn: 'root' },
  withState<OrganizationProjectsState>(createEmptyEntityState<OrganizationProjects>()),
  withComputed((store) => ({
    all: computed(() => store.ids().map((id) => store.entities()[id])),
    count: computed(() => store.ids().length),
  })),
  withMethods((store, orgProjectsService = inject(OrganizationProjectsService)) => ({
    async loadByProjectIds(projectIds: string[]): Promise<void> {
      if (!projectIds || projectIds.length === 0) return;
      patchState(store, { loading: true, error: null });
      try {
        const res = await orgProjectsService.find({
          where: { projectId: { [Operator.IN]: Array.from(new Set(projectIds)) } }
        });
        const items = (res.data ?? []) as OrganizationProjects[];
        const next = createEmptyEntityState<OrganizationProjects>();
        const updated = upsertMany(next, items);
        patchState(store, updated);
      } catch (e: any) {
        patchState(store, { error: e?.message ?? 'Failed to load organization projects' });
      } finally {
        patchState(store, { loading: false });
      }
    },
    byOrganizationId(orgId: string) {
      return computed(() =>
        store
          .ids()
          .map((id) => store.entities()[id])
          .filter((x) => x.organizationId === orgId)
      );
    },
    byProjectId(projectId: string) {
      return computed(() =>
        store
          .ids()
          .map((id) => store.entities()[id])
          .filter((x) => x.projectId === projectId)
      );
    },
    replaceAll(items: OrganizationProjects[]) {
      const next = createEmptyEntityState<OrganizationProjects>();
      const updated = upsertMany(next, items);
      patchState(store, updated);
    },
    upsertMany(items: OrganizationProjects[]) {
      patchState(store, (state) => upsertMany(state, items));
    },
    upsertOne(item: OrganizationProjects) {
      patchState(store, (state) => upsertOne(state, item));
    },
    removeOne(id: string) {
      patchState(store, (state) => removeOne(state, id));
    },
    clear() {
      patchState(store, createEmptyEntityState<OrganizationProjects>());
    },
    setLoading(loading: boolean) {
      patchState(store, { loading });
    },
    setError(error: string | null) {
      patchState(store, { error });
    },
    async find(query?: FetchQuery): Promise<FindResultDto<OrganizationProjects>> {
      const res = await orgProjectsService.find(query);
      patchState(store, (state) => upsertMany(state, res.data ?? []));
      return res;
    },
    async findById(id: string): Promise<OrganizationProjects> {
      const res = await orgProjectsService.findById(id);
      patchState(store, (state) => upsertOne(state, res));
      return res;
    },
    async save(entity: OrganizationProjects): Promise<OrganizationProjects> {
      const res = await orgProjectsService.save(entity);
      patchState(store, (state) => upsertOne(state, res));
      return res;
    },
    async delete(id: string): Promise<void> {
      await orgProjectsService.delete(id);
      patchState(store, (state) => removeOne(state, id));
    },
  }))
);


