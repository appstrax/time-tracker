import { Project, TimeSheetEntry, User } from '@models';

import { buildProjectRows, summarizeEntries } from './analytics-rows.util';

function makeProject(id: string): Project {
  const project = new Project();
  project.id = id;
  project.name = id;
  return project;
}

function makeEntry(
  projectId: string,
  userId: string,
  hours: number,
  approved: boolean,
  date = new Date(2026, 0, 15),
): TimeSheetEntry {
  const entry = new TimeSheetEntry();
  entry.projectId = projectId;
  entry.userId = userId;
  entry.hours = hours;
  entry.approved = approved;
  entry.date = date;
  return entry;
}

function makeUser(id: string, name: string): User {
  const user = new User();
  user.id = id;
  user.name = name;
  return user;
}

describe('summarizeEntries', () => {
  it('splits hours into approved and pending', () => {
    const totals = summarizeEntries([
      makeEntry('a', 'u1', 3, true),
      makeEntry('a', 'u1', 2, false),
      makeEntry('b', 'u2', 1.5, false),
    ]);
    expect(totals).toEqual({
      total: 6.5,
      approved: 3,
      pending: 3.5,
      pendingCount: 2,
      contributors: 2,
    });
  });

  it('returns zeros for no entries', () => {
    expect(summarizeEntries([])).toEqual({
      total: 0,
      approved: 0,
      pending: 0,
      pendingCount: 0,
      contributors: 0,
    });
  });
});

describe('buildProjectRows', () => {
  const alpha = makeProject('alpha');
  const beta = makeProject('beta');

  it('sorts projects by hours, highest first', () => {
    const rows = buildProjectRows(
      [alpha, beta],
      [makeEntry('alpha', 'u1', 1, true), makeEntry('beta', 'u1', 4, true)],
      [],
    );
    expect(rows.map((row) => row.id)).toEqual(['beta', 'alpha']);
  });

  it('computes approval split and percent per project', () => {
    const [row] = buildProjectRows(
      [alpha],
      [makeEntry('alpha', 'u1', 3, true), makeEntry('alpha', 'u1', 1, false)],
      [],
    );
    expect(row.hours).toBe(4);
    expect(row.approved).toBe(3);
    expect(row.pending).toBe(1);
    expect(row.approvedPercent).toBe(75);
  });

  it('keeps projects with no hours at zero percent', () => {
    const [row] = buildProjectRows([alpha], [], []);
    expect(row.hours).toBe(0);
    expect(row.approvedPercent).toBe(0);
    expect(row.lastActivity).toBeNull();
  });

  it('reports the latest activity date', () => {
    const [row] = buildProjectRows(
      [alpha],
      [
        makeEntry('alpha', 'u1', 1, true, new Date(2026, 0, 10)),
        makeEntry('alpha', 'u1', 1, true, new Date(2026, 0, 20)),
      ],
      [],
    );
    expect(row.lastActivity).toEqual(new Date(2026, 0, 20));
  });

  it('lists contributor initials and counts', () => {
    const users = [makeUser('u1', 'Ada Lovelace'), makeUser('u2', 'Grace')];
    const [row] = buildProjectRows(
      [alpha],
      [makeEntry('alpha', 'u1', 1, true), makeEntry('alpha', 'u2', 1, true)],
      users,
    );
    expect(row.contributorCount).toBe(2);
    expect(row.contributors).toEqual(['AL', 'G']);
  });
});
