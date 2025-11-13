import { computed, inject } from '@angular/core';

import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
} from '@ngrx/signals';

import {
  FetchQuery,
  FindResultDto,
  Operator,
} from '@appstrax/services/database';

import { Organization } from '@models';
import { OrganizationService } from '@services';
import {
  EntityState,
  createEmptyEntityState,
  upsertMany,
  upsertOne,
  removeOne,
} from '@state';

interface OrganizationsState extends EntityState<Organization> {}

export const OrganizationsStore = signalStore(
  { providedIn: 'root' },
  withState<OrganizationsState>(createEmptyEntityState<Organization>()),
  withComputed((store) => ({
    all: computed(() => store.ids().map((id) => store.entities()[id])),
    count: computed(() => store.ids().length),
  })),
  withMethods((store, organizationService = inject(OrganizationService)) => ({
    async loadByIds(ids: string[]): Promise<void> {
      if (!ids || ids.length === 0) return;
      patchState(store, { loading: true, error: null });
      try {
        const res = await organizationService.find({
          where: { id: { [Operator.IN]: Array.from(new Set(ids)) } },
        });
        const orgs = (res.data ?? []) as Organization[];
        patchState(store, (state) => upsertMany(state, orgs));
      } catch (e: any) {
        patchState(store, {
          error: e?.message ?? 'Failed to load organizations',
        });
      } finally {
        patchState(store, { loading: false });
      }
    },
    replaceAll(orgs: Organization[]) {
      const next = createEmptyEntityState<Organization>();
      const updated = upsertMany(next, orgs);
      patchState(store, updated);
    },
    upsertMany(orgs: Organization[]) {
      patchState(store, (state) => upsertMany(state, orgs));
    },
    upsertOne(org: Organization) {
      patchState(store, (state) => upsertOne(state, org));
    },
    removeOne(id: string) {
      patchState(store, (state) => removeOne(state, id));
    },
    clear() {
      patchState(store, createEmptyEntityState<Organization>());
    },
    setLoading(loading: boolean) {
      patchState(store, { loading });
    },
    setError(error: string | null) {
      patchState(store, { error });
    },
    async find(query?: FetchQuery): Promise<FindResultDto<Organization>> {
      const res = await organizationService.find(query);
      patchState(store, (state) => upsertMany(state, res.data ?? []));
      return res;
    },
    async findById(id: string): Promise<Organization> {
      const res = await organizationService.findById(id);
      patchState(store, (state) => upsertOne(state, res));
      return res;
    },
    async save(entity: Organization): Promise<Organization> {
      const res = await organizationService.save(entity);
      patchState(store, (state) => upsertOne(state, res));
      return res;
    },
    async delete(id: string): Promise<void> {
      await organizationService.delete(id);
      patchState(store, (state) => removeOne(state, id));
    },
  }))
);
