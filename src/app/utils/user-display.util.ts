import { User, UserRole } from '@models';

export function getUserDisplayName(
  user: User | null,
  fallback = 'Unknown user',
): string {
  if (!user) {
    return fallback;
  }

  const fullName = `${user.name} ${user.surname}`.trim();
  return fullName || user.email || user.id;
}

export function getProfileLinkLabel(user: User | null): string {
  const name = getUserDisplayName(user, '');
  return name ? `Profile, ${name}` : 'Profile';
}

export function getUserSubtitle(user: User | null): string {
  if (!user) {
    return '';
  }
  if (user.role === UserRole.ADMIN) {
    return 'Administrator';
  }
  return user.email;
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
