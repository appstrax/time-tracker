import {
  signalStore,
  withState,
  withMethods,
  patchState,
  withHooks,
} from '@ngrx/signals';
import { appstraxAuth, User as AuthUser } from '@appstrax/services/auth';

import { User } from '@models';

interface UserState {
  user: User | null;
  fetchedAt: Date | null;
  loading: boolean;
}

const initialState: UserState = {
  user: null,
  fetchedAt: null,
  loading: false,
};

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState<UserState>(initialState),
  withMethods((store) => ({
    async initialize(): Promise<void> {
      patchState(store, { loading: true });
      try {
        const authUser = await appstraxAuth.getUser();
        this.setFromAuthUser(authUser);
      } catch (e: any) {
        patchState(store, { fetchedAt: new Date() });
      } finally {
        patchState(store, { loading: false });
      }
    },
    setFromAuthUser(authUser: AuthUser) {
      const user = User.fromAuthUser(authUser);
      patchState(store, { user, fetchedAt: new Date() });
    },

    clear() {
      patchState(store, initialState);
    },
    setLoading(loading: boolean) {
      patchState(store, { loading });
    },
  })),

  withHooks({
    onInit(store) {
      const unsubscribe = appstraxAuth.subscribeToUserChanges((user) => {
        if (user) {
          store.setFromAuthUser(user);
        }
      });

      return () => unsubscribe();
    },
  }),
);
