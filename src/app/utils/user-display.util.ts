import { User } from '@models';

export function getUserDisplayName(user: User | null): string {
  if (!user) {
    return 'Unknown user';
  }

  const fullName = `${user.name} ${user.surname}`.trim();
  return fullName || user.email || user.id;
}

export function getUserInitials(user: User | null): string {
  if (!user) {
    return 'U';
  }

  const initials = [user.name, user.surname]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .map((value) => value.charAt(0).toUpperCase())
    .join('');

  return initials || user.email?.charAt(0).toUpperCase() || 'U';
}
