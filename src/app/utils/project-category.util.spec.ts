import { Project, TimeSheetEntry } from '@models';

import {
  categoryFilterOptions,
  categorySuggestions,
  DEFAULT_PROJECT_CATEGORIES,
  normalizeProjectCategories,
  seedNewProjectCategories,
  validateProjectCategories,
} from './project-category.util';

describe('project-category.util', () => {
  it('seedNewProjectCategories copies defaults', () => {
    const project = new Project();
    seedNewProjectCategories(project);
    expect(project.categories).toEqual([...DEFAULT_PROJECT_CATEGORIES]);
  });

  it('normalizeProjectCategories trims, drops blanks, dedupes', () => {
    expect(
      normalizeProjectCategories(['  Dev ', '', 'Dev', 'Meetings']),
    ).toEqual(['Dev', 'Meetings']);
  });

  it('validateProjectCategories rejects blank and duplicate names', () => {
    expect(validateProjectCategories(['A', ''])).toContain('blank');
    expect(validateProjectCategories(['A', 'A'])).toContain('Duplicate');
    expect(validateProjectCategories(['A', 'B'])).toBeNull();
  });

  it('categorySuggestions lists project categories first, then custom ones without duplicates', () => {
    const project = new Project();
    project.categories = ['Development'];
    expect(
      categorySuggestions(project, [
        'Legacy',
        'Development',
        ' Legacy ',
        'development',
      ]),
    ).toEqual(['Development', 'Legacy']);
  });

  it('categorySuggestions falls back when project list is empty', () => {
    const project = new Project();
    expect(categorySuggestions(project, ['Legacy', 'Legacy'])).toEqual([
      'Legacy',
    ]);
  });

  it('categoryFilterOptions merges project list with stray entry values', () => {
    const project = new Project();
    project.id = 'p1';
    project.categories = ['Development', 'Meetings'];

    const entry = new TimeSheetEntry();
    entry.projectId = 'p1';
    entry.category = 'standup';

    expect(
      categoryFilterOptions([entry], [project], 'p1'),
    ).toEqual(['Development', 'Meetings', 'standup']);
  });

  it('categoryFilterOptions ignores other projects when a project is selected', () => {
    const project = new Project();
    project.id = 'p1';
    project.categories = ['Development'];

    const ownEntry = new TimeSheetEntry();
    ownEntry.projectId = 'p1';
    ownEntry.category = 'standup';

    const otherEntry = new TimeSheetEntry();
    otherEntry.projectId = 'p2';
    otherEntry.category = 'OtherProjectOnly';

    expect(
      categoryFilterOptions([ownEntry, otherEntry], [project], 'p1'),
    ).toEqual(['Development', 'standup']);
  });

  it('categoryFilterOptions without project sorts entry categories only', () => {
    const e1 = new TimeSheetEntry();
    e1.category = 'B';
    const e2 = new TimeSheetEntry();
    e2.category = 'A';
    expect(categoryFilterOptions([e1, e2], [], undefined)).toEqual(['A', 'B']);
  });
});
