import { Project, TimeSheetEntry } from '@models';

export const DEFAULT_PROJECT_CATEGORIES = [
  'Development',
  'Meetings',
  'Code Review',
  'Support',
  'Admin',
] as const;

export function seedNewProjectCategories(project: Project): void {
  project.categories = [...DEFAULT_PROJECT_CATEGORIES];
}

export function normalizeProjectCategories(categories: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of categories) {
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

export function validateProjectCategories(categories: string[]): string | null {
  const seen = new Set<string>();
  for (const raw of categories) {
    const trimmed = raw.trim();
    if (!trimmed) {
      return 'Category names cannot be blank';
    }
    if (seen.has(trimmed)) {
      return `Duplicate category: "${trimmed}"`;
    }
    seen.add(trimmed);
  }
  return null;
}

function trimmedProjectCategories(project: Project | undefined): string[] {
  if (!project?.categories?.length) return [];
  return project.categories.map((c) => c.trim()).filter((c) => c.length > 0);
}

export function categorySuggestions(
  project: Project | undefined,
  fallback: string[],
): string[] {
  const fromProject = trimmedProjectCategories(project);
  if (fromProject.length) return fromProject;
  return [
    ...new Set(
      fallback.map((c) => c.trim()).filter((c) => c.length > 0),
    ),
  ];
}

export function isCategoryAllowed(
  project: Project | undefined,
  category: string,
  grandfather?: string,
): boolean {
  const trimmed = category.trim();
  if (!trimmed) return false;

  const list = trimmedProjectCategories(project);
  if (!list.length || project?.allowCustomCategory !== false) {
    return true;
  }

  const grandfatherTrimmed = grandfather?.trim();
  if (grandfatherTrimmed && trimmed === grandfatherTrimmed) {
    return true;
  }

  return list.includes(trimmed);
}

export function categoryFilterOptions(
  entries: TimeSheetEntry[],
  projects: Project[],
  projectId?: string,
): string[] {
  const fromEntries = [
    ...new Set(
      entries
        .map((entry) => entry.category?.trim())
        .filter((category): category is string => !!category),
    ),
  ];

  if (!projectId) {
    return fromEntries.sort();
  }

  const project = projects.find((p) => p.id === projectId);
  const projectList = trimmedProjectCategories(project);
  const extras = fromEntries
    .filter((c) => !projectList.includes(c))
    .sort();

  return [...projectList, ...extras];
}
