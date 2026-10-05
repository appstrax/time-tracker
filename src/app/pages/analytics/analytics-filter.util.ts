import { AnalyticsFilter, Project, TimeSheetEntry } from '@models';

/** Applies the shared analytics filter (dates, user, category, status) to entries. */
export function filterAnalyticsEntries(
  entries: TimeSheetEntry[],
  filter: AnalyticsFilter,
): TimeSheetEntry[] {
  return entries.filter((e) => {
    if (filter.start && e.date < filter.start) return false;
    if (filter.end && e.date > filter.end) return false;
    if (filter.userId && e.userId !== filter.userId) return false;
    if (filter.category && e.category !== filter.category) return false;
    if (filter.status === 'approved' && !e.approved) return false;
    if (filter.status === 'pending' && e.approved) return false;
    return true;
  });
}

/**
 * Narrows projects to the ones the selected team member belongs to, plus any
 * they have logged time on — so hours stay reachable after they are removed
 * from a project.
 */
export function scopeProjectsToUser(
  projects: Project[],
  userId: string | undefined,
  entries: TimeSheetEntry[],
): Project[] {
  if (!userId) return projects;

  const loggedProjectIds = new Set(
    entries.filter((e) => e.userId === userId).map((e) => e.projectId),
  );

  return projects.filter(
    (project) =>
      (project.users ?? []).some((user) => user.id === userId) ||
      loggedProjectIds.has(project.id),
  );
}

/** Categories the selected team member has actually logged, sorted. */
export function userCategoryOptions(
  entries: TimeSheetEntry[],
  userId: string,
): string[] {
  return [
    ...new Set(
      entries
        .filter((entry) => entry.userId === userId)
        .map((entry) => entry.category?.trim())
        .filter((category): category is string => !!category),
    ),
  ].sort();
}

export function formatDateInput(date?: Date): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
