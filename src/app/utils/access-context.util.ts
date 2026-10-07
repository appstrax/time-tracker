import { appstraxAuth } from '@appstrax/services/auth';

import { UserRole } from '@models';
import { Store } from '@state';

import { ProjectMemberships } from './project-access.util';

export interface AccessContext {
  memberships: ProjectMemberships;
  platformAdmin: boolean;
}

/**
 * Resolves the signed-in user and refetches their project memberships.
 * Returns `null` when there is no authenticated user (the caller should send
 * them to '/login'). If only the membership fetch fails, the error is logged
 * and the store's last good memberships are used (empty if there were none),
 * so callers decide fail-open or fail-closed without ever redirecting to ''.
 */
export async function loadAccessContext(store: Store): Promise<AccessContext | null> {
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
    return { memberships: store.access.memberships(), platformAdmin };
  }
}
