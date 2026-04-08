import {
  signalStore,
  withState,
  withMethods,
  patchState,
  withHooks,
} from '@ngrx/signals';
import { inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export interface Params {
  containerId?: string;
  path?: string;
  search?: string;
  selected?: string;
  permissionGroup?: string;
}

interface RouteState {
  params: Params;
}

const initialState: RouteState = {
  params: {
    containerId: '',
    path: '',
    search: '',
    selected: '',
    permissionGroup: '',
  },
};

export const RouteStore = signalStore(
  { providedIn: 'root' },
  withState<RouteState>(initialState),
  withMethods((store) => {
    const router = inject(Router);

    return {
      setRoute() {
        const url = router.url;
        const urlTree = router.parseUrl(url);

        patchState(store, {
          params: {
            ...urlTree.queryParams,
          },
        });
      },

      clear() {
        patchState(store, initialState);
      },
    };
  }),

  withHooks({
    onInit(store) {
      const router = inject(Router);
      store.setRoute();

      const subscription = router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          store.setRoute();
        });

      return () => {
        subscription.unsubscribe();
      };
    },
  }),
);
