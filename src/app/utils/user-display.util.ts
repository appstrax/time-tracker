import { User } from '@models';

export function getUserDisplayName(user: User | null): string {
  if (!user) {
    return 'Unknown user';
  }

  const fullName = `${user.name} ${user.surname}`.trim();
  return fullName || user.email || user.id;
}
