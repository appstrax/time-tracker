import { Project } from '@models';

import { ColorList } from './color-list';

const LAST_SELECTED_PROJECT_KEY = 'timeSheet.lastProjectId';

/** Theme tag colours plus mixes — still derived from `--tag-*` and `--color-bg`. */
const TAG_MIX_STOPS = [82, 68, 54] as const;

export function getThemeProjectColorSlots(): string[] {
  const slots: string[] = [...ColorList.tagThemeVars];
  for (const tag of ColorList.tagThemeVars) {
    for (const stop of TAG_MIX_STOPS) {
      slots.push(`color-mix(in srgb, ${tag} ${stop}%, var(--color-bg))`);
    }
  }
  return slots;
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

  const ordered = [...projects].sort((a, b) => {
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

export function getStoredTimeSheetProjectId(): string | null {
  try {
    return localStorage.getItem(LAST_SELECTED_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function storeTimeSheetProjectId(projectId: string): void {
  if (!projectId) return;
  try {
    localStorage.setItem(LAST_SELECTED_PROJECT_KEY, projectId);
  } catch {}
}

export function clearStoredTimeSheetProjectId(): void {
  try {
    localStorage.removeItem(LAST_SELECTED_PROJECT_KEY);
  } catch {}
}
