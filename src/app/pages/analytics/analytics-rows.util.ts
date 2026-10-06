import { Project, TimeSheetEntry, User } from '@models';
import { buildProjectColorMap, getUserDisplayName } from '@utils';

export interface ProjectRow {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  color: string;
  hours: number;
  approved: number;
  pending: number;
  approvedPercent: number;
  contributors: string[];
  contributorCount: number;
  lastActivity: Date | null;
}

export interface EntryTotals {
  total: number;
  approved: number;
  pending: number;
  pendingCount: number;
  contributors: number;
}

function sumHours(entries: TimeSheetEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.hours || 0), 0);
}

export function summarizeEntries(entries: TimeSheetEntry[]): EntryTotals {
  const approved = sumHours(entries.filter((e) => e.approved));
  const pending = sumHours(entries.filter((e) => !e.approved));
  return {
    total: approved + pending,
    approved,
    pending,
    pendingCount: entries.filter((e) => !e.approved).length,
    contributors: new Set(entries.map((e) => e.userId)).size,
  };
}

function initials(user: User | null): string {
  const name = getUserDisplayName(user, '?');
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

/**
 * One row per project with its hours, approval split and latest activity,
 * sorted by hours. Colours come from `allProjects` so a project keeps its
 * colour however the list is scoped.
 */
export function buildProjectRows(
  projects: Project[],
  entries: TimeSheetEntry[],
  users: User[],
  allProjects: Project[] = projects,
): ProjectRow[] {
  const colors = buildProjectColorMap(allProjects);
  const usersById = new Map(users.map((u) => [u.id, u]));

  return projects
    .map((project) => {
      const own = entries.filter((e) => e.projectId === project.id);
      const { total, approved, pending } = summarizeEntries(own);
      const userIds = [...new Set(own.map((e) => e.userId))];
      const latest = own.reduce<Date | null>(
        (max, e) => (!max || e.date > max ? e.date : max),
        null,
      );
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        logoUrl: project.logoUrl,
        color: colors.get(project.id) ?? 'var(--color-primary)',
        hours: total,
        approved,
        pending,
        approvedPercent: total ? (approved / total) * 100 : 0,
        contributors: userIds
          .slice(0, 3)
          .map((id) => initials(usersById.get(id) ?? null)),
        contributorCount: userIds.length,
        lastActivity: latest,
      };
    })
    .sort((a, b) => b.hours - a.hours);
}
