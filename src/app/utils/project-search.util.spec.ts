import { filterProjectsByTerm } from './project-search.util';

describe('filterProjectsByTerm', () => {
  const alpha = { name: 'Alpha Portal', description: 'Customer website' };
  const beta = { name: 'Beta', description: 'Internal tooling' };
  const gamma = { name: 'Gamma', description: null };
  const all = [alpha, beta, gamma];

  it('returns every project for a blank term', () => {
    expect(filterProjectsByTerm(all, '')).toBe(all);
    expect(filterProjectsByTerm(all, '   ')).toBe(all);
  });

  it('matches on name, ignoring case and surrounding whitespace', () => {
    expect(filterProjectsByTerm(all, '  ALPHA ')).toEqual([alpha]);
  });

  it('matches on description', () => {
    expect(filterProjectsByTerm(all, 'tooling')).toEqual([beta]);
  });

  it('copes with missing descriptions', () => {
    expect(filterProjectsByTerm(all, 'gamma')).toEqual([gamma]);
  });

  it('returns nothing when no project matches', () => {
    expect(filterProjectsByTerm(all, 'zzz')).toEqual([]);
  });
});
