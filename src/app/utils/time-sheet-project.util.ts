import { Project, User, UserRole } from '@models';

import { ColorList } from './color-list';

/** Projects a given user may log time against. Non-admins' projects are already
 * scoped server-side to their memberships; admins otherwise see every project,
 * so narrow those down to ones they're actually a member of. */
export function filterAssignedProjects(
  projects: Project[],
  user: User | null | undefined,
): Project[] {
  if (user?.role !== UserRole.ADMIN) return projects;
  return projects.filter((project) =>
    project.users.some((member) => member.id === user.id),
  );
}

/** The time sheet page's project filter. Absent means "all projects". The entry
 * modal has no persisted default of its own — it seeds from this filter. */
const FILTER_PROJECT_KEY = 'timeSheet.filterProjectId';
const LEGACY_FILTER_PROJECT_KEY = 'timeSheet.lastProjectId';

/** Theme tag colours plus mixes — still derived from `--tag-*` and `--color-bg`. */
const TAG_MIXES = [
  { stop: 82, tone: 'Light' },
  { stop: 68, tone: 'Lighter' },
  { stop: 54, tone: 'Lightest' },
] as const;

export interface ThemeProjectColorOption {
  value: string;
  label: string;
}

function themeTagLabel(tag: string): string {
  const name = tag.match(/--tag-([a-z0-9-]+)/i)?.[1] ?? 'colour';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function getThemeProjectColorOptions(): ThemeProjectColorOption[] {
  const tags = ColorList.tagThemeVars;
  const options: ThemeProjectColorOption[] = tags.map((tag) => ({
    value: tag,
    label: themeTagLabel(tag),
  }));

  for (const tag of tags) {
    const name = themeTagLabel(tag).toLowerCase();
    for (const mix of TAG_MIXES) {
      options.push({
        value: `color-mix(in srgb, ${tag} ${mix.stop}%, var(--color-bg))`,
        label: `${mix.tone} ${name}`,
      });
    }
  }

  return options;
}

export function getThemeProjectColorSlots(): string[] {
  return getThemeProjectColorOptions().map((option) => option.value);
}

export function hashProjectId(projectId: string): number {
  let hash = 5381;
  for (let i = 0; i < projectId.length; i++) {
    hash = ((hash << 5) + hash) ^ projectId.charCodeAt(i);
  }
  return hash >>> 0;
}

function assignProjectColors(projects: Project[]): Map<string, string> {
  const slots = getThemeProjectColorSlots();
  const usedColors = new Set<string>();
  const map = new Map<string, string>();

  const unassigned: Project[] = [];
  for (const project of projects) {
    if (project.color) {
      map.set(project.id, project.color);
      usedColors.add(project.color);
    } else {
      unassigned.push(project);
    }
  }

  const ordered = unassigned.sort((a, b) => {
    const hashDiff = hashProjectId(a.id) - hashProjectId(b.id);
    return hashDiff !== 0 ? hashDiff : a.id.localeCompare(b.id);
  });

  for (const project of ordered) {
    const start = hashProjectId(project.id) % slots.length;
    for (let attempt = 0; attempt < slots.length; attempt++) {
      const color = slots[(start + attempt) % slots.length];
      if (usedColors.has(color)) continue;
      usedColors.add(color);
      map.set(project.id, color);
      break;
    }
  }

  return map;
}

export function buildProjectColorMap(projects: Project[]): Map<string, string> {
  return assignProjectColors(projects);
}

export function getProjectColor(projectId: string, projects: Project[]): string {
  if (!projectId) {
    return ColorList.tagThemeVars[0];
  }

  const known = projects.some((project) => project.id === projectId);
  const map = assignProjectColors(
    known ? projects : [...projects, { id: projectId } as Project],
  );
  return map.get(projectId) ?? ColorList.tagThemeVars[0];
}

/** Colour for a new project: the first slot not already shown, else a stable pick from the seed. */
export function pickNewProjectColor(projects: Project[], seed: string): string {
  const slots = getThemeProjectColorSlots();
  const used = new Set(buildProjectColorMap(projects).values());
  return (
    slots.find((slot) => !used.has(slot)) ??
    slots[hashProjectId(seed) % slots.length]
  );
}

export function getStoredTimeSheetFilterProjectId(): string | null {
  try {
    const stored = localStorage.getItem(FILTER_PROJECT_KEY);
    if (stored !== null) {
      return stored;
    }
    const legacy = localStorage.getItem(LEGACY_FILTER_PROJECT_KEY);
    if (!legacy) {
      return null;
    }
    localStorage.setItem(FILTER_PROJECT_KEY, legacy);
    localStorage.removeItem(LEGACY_FILTER_PROJECT_KEY);
    return legacy;
  } catch {
    return null;
  }
}

export function storeTimeSheetFilterProjectId(projectId: string): void {
  if (!projectId) return;
  try {
    localStorage.setItem(FILTER_PROJECT_KEY, projectId);
  } catch {}
}

export function clearStoredTimeSheetFilterProjectId(): void {
  try {
    localStorage.removeItem(FILTER_PROJECT_KEY);
  } catch {}
}
