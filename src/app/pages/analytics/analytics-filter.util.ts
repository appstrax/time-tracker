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

/**
 * Narrows projects to the picked one. An empty id, or one that is not in
 * `known` (the list the dropdown offers), leaves them all. A known project
 * outside `projects` yields none, e.g. one the selected member has no part in.
 */
export function narrowToProject(
  projects: Project[],
  projectId: string | undefined,
  known: Project[] = projects,
): Project[] {
  if (!projectId || !known.some((p) => p.id === projectId)) return projects;
  return projects.filter((p) => p.id === projectId);
}

/**
 * Per project, the ids of the team members to offer: its current members plus
 * anyone who logged time on it, so former members stay selectable.
 */
export function buildProjectUserIds(
  projects: Project[],
  entries: TimeSheetEntry[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const project of projects) {
    map.set(project.id, new Set((project.users ?? []).map((u) => u.id)));
  }
  for (const entry of entries) {
    map.get(entry.projectId)?.add(entry.userId);
  }
  return map;
}

/**
 * Whether the project and team member filters can apply together. Either one
 * missing, or a project that is not known, never conflicts.
 */
export function isProjectUserPairValid(
  projectUserIds: Map<string, Set<string>>,
  projectId: string | undefined,
  userId: string | undefined,
): boolean {
  if (!projectId || !userId) return true;
  const ids = projectUserIds.get(projectId);
  return !ids || ids.has(userId);
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
