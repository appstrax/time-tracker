import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { appstraxAuth, User as AuthUser } from '@appstrax/services/auth';
import { User } from '@models';

interface UserState {
  current: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  current: null,
  loading: false,
  error: null,
};

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState<UserState>(initialState),
  withMethods((store) => ({
    async loadCurrent(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const authUser = await appstraxAuth.getUser();
        const user = new User();
        user.id = authUser.id;
        user.email = authUser.email;
        patchState(store, { current: user });
      } catch (e: any) {
        patchState(store, { error: e?.message ?? 'Failed to load user' });
      } finally {
        patchState(store, { loading: false });
      }
    },
    setCurrentFromAuthUser(authUser: AuthUser) {
      const user = new User();
      user.id = authUser.id;
      user.email = authUser.email;
      patchState(store, { current: user });
    },
    setCurrent(user: User | null) {
      patchState(store, { current: user });
    },
    clear() {
      patchState(store, initialState);
    },
    setLoading(loading: boolean) {
      patchState(store, { loading });
    },
    setError(error: string | null) {
      patchState(store, { error });
    },
  }))
);
