import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { EntityState, createEmptyEntityState, upsertMany, upsertOne, removeOne } from './entity-state';
import { OrganizationProjects } from '../models/many-to-many.model';
import { OrganizationProjectsService } from '../services/organization.service';
import { Operator } from '@appstrax/services/database';

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
  }))
);


