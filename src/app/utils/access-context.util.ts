import { appstraxAuth } from '@appstrax/services/auth';

import { UserRole } from '@models';
import { ToastService } from '@services';
import { Store } from '@state';

import { ProjectMemberships } from './project-access.util';

export const STALE_ACCESS_MESSAGE =
  "Couldn't refresh your permissions. Treating you as having no project access until this succeeds.";

export interface AccessContext {
  memberships: ProjectMemberships;
  platformAdmin: boolean;
}

/**
 * Resolves the signed-in user and refetches their project memberships.
 * Returns `null` when there is no authenticated user (the caller should send
 * them to '/login'). If only the membership fetch fails, the error is logged
 * and the store fails closed - it clears its memberships rather than keeping
 * a possibly-revoked role in place - so every permission check denies until a
 * refresh next succeeds, without ever redirecting to ''. `platformAdmin` is
 * unaffected: it comes fresh from the auth user on every call, never cached.
 * The user is warned here only, at most once until a refresh next succeeds.
 */
export async function loadAccessContext(
  store: Store,
  toast: ToastService,
): Promise<AccessContext | null> {
  let authUser;
  try {
    authUser = await appstraxAuth.getUser();
  } catch {
    return null;
  }
  if (!authUser) return null;

  const platformAdmin = authUser.roles.includes(UserRole.ADMIN);
  try {
    return { memberships: await store.access.refresh(authUser.id), platformAdmin };
  } catch (error) {
    console.error('Failed to refresh project memberships', error);
    if (store.access.claimStaleWarning()) toast.warning(STALE_ACCESS_MESSAGE);
    return { memberships: store.access.memberships(), platformAdmin };
  }
}
