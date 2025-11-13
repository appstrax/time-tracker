import { computed, inject } from '@angular/core';

import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';

import { OrganizationUsers } from '@models';
import { OrganizationUsersService } from '@services';
import { EntityState, createEmptyEntityState, upsertMany, upsertOne, removeOne } from '@state';
import { FetchQuery, FindResultDto } from '@appstrax/services/database';

interface OrganizationUsersState extends EntityState<OrganizationUsers> {}

export const OrganizationUsersStore = signalStore(
  { providedIn: 'root' },
  withState<OrganizationUsersState>(createEmptyEntityState<OrganizationUsers>()),
  withComputed((store) => ({
    all: computed(() => store.ids().map((id) => store.entities()[id])),
    count: computed(() => store.ids().length),
  })),
  withMethods((store, orgUsersService = inject(OrganizationUsersService)) => ({
    async loadForUser(userId: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const res = await orgUsersService.find({ where: { userId } });
        const items = res.data as OrganizationUsers[];
        const next = createEmptyEntityState<OrganizationUsers>();
        const updated = upsertMany(next, items);
        patchState(store, updated);
      } catch (e: any) {
        patchState(store, { error: e?.message ?? 'Failed to load organization users' });
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
    byUserId(userId: string) {
      return computed(() =>
        store
          .ids()
          .map((id) => store.entities()[id])
          .filter((x) => x.userId === userId)
      );
    },
    replaceAll(items: OrganizationUsers[]) {
      const next = createEmptyEntityState<OrganizationUsers>();
      const updated = upsertMany(next, items);
      patchState(store, updated);
    },
    upsertMany(items: OrganizationUsers[]) {
      patchState(store, (state) => upsertMany(state, items));
    },
    upsertOne(item: OrganizationUsers) {
      patchState(store, (state) => upsertOne(state, item));
    },
    removeOne(id: string) {
      patchState(store, (state) => removeOne(state, id));
    },
    clear() {
      patchState(store, createEmptyEntityState<OrganizationUsers>());
    },
    setLoading(loading: boolean) {
      patchState(store, { loading });
    },
    setError(error: string | null) {
      patchState(store, { error });
    },
    async find(query?: FetchQuery): Promise<FindResultDto<OrganizationUsers>> {
      const res = await orgUsersService.find(query);
      patchState(store, (state) => upsertMany(state, res.data ?? []));
      return res;
    },
    async findById(id: string): Promise<OrganizationUsers> {
      const res = await orgUsersService.findById(id);
      patchState(store, (state) => upsertOne(state, res));
      return res;
    },
    async save(entity: OrganizationUsers): Promise<OrganizationUsers> {
      const res = await orgUsersService.save(entity);
      patchState(store, (state) => upsertOne(state, res));
      return res;
    },
    async delete(id: string): Promise<void> {
      await orgUsersService.delete(id);
      patchState(store, (state) => removeOne(state, id));
    },
  }))
);


