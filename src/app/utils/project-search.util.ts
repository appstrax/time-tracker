interface Searchable {
  name?: string | null;
  description?: string | null;
}

/** Case-insensitive match of the term against each project's name and description. */
export function filterProjectsByTerm<T extends Searchable>(
  projects: T[],
  term: string,
): T[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return projects;

  return projects.filter(
    (project) =>
      (project.name ?? '').toLowerCase().includes(needle) ||
      (project.description ?? '').toLowerCase().includes(needle),
  );
}
