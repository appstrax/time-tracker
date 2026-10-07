import { appstraxAuth } from '@appstrax/services/auth';

import { UserRole } from '@models';
import { Store } from '@state';

import { ProjectMemberships } from './project-access.util';

/** Resolves the signed-in user and refetches their project memberships. Throws if there is no user. */
export async function loadAccessContext(store: Store): Promise<{
  memberships: ProjectMemberships;
  platformAdmin: boolean;
}> {
  const authUser = await appstraxAuth.getUser();
  const memberships = await store.access.refresh(authUser.id);
  return { memberships, platformAdmin: authUser.roles.includes(UserRole.ADMIN) };
}
