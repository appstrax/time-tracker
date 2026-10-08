import { Project, TimeSheetEntry, User } from '@models';

import {
  buildProjectUserIds,
  narrowToProject,
  scopeProjectsToUser,
  userCategoryOptions,
} from './analytics-filter.util';

function project(id: string, memberIds: string[]): Project {
  const p = new Project();
  p.id = id;
  p.name = id;
  p.users = memberIds.map((memberId) => {
    const user = new User();
    user.id = memberId;
    return user;
  });
  return p;
}

describe('scopeProjectsToUser', () => {
  const alpha = project('alpha', ['u1']);
  const beta = project('beta', ['u2']);
  const shared = project('shared', ['u1', 'u2']);

  function loggedOn(projectId: string, userId: string): TimeSheetEntry {
    const entry = new TimeSheetEntry();
    entry.projectId = projectId;
    entry.userId = userId;
    return entry;
  }

  it('returns every project when no user is selected', () => {
    expect(scopeProjectsToUser([alpha, beta, shared], undefined, [])).toEqual([
      alpha,
      beta,
      shared,
    ]);
  });

  it('keeps the projects the selected user is a member of', () => {
    expect(scopeProjectsToUser([alpha, beta, shared], 'u1', [])).toEqual([
      alpha,
      shared,
    ]);
  });

  it('keeps a project the user logged time on after losing membership', () => {
    expect(
      scopeProjectsToUser([alpha, beta, shared], 'u1', [
        loggedOn('beta', 'u1'),
      ]),
    ).toEqual([alpha, beta, shared]);
  });

  it('ignores time another user logged on a project', () => {
    expect(
      scopeProjectsToUser([alpha, beta, shared], 'u1', [
        loggedOn('beta', 'u2'),
      ]),
    ).toEqual([alpha, shared]);
  });

  it('returns nothing when the user is in no project and logged nothing', () => {
    expect(scopeProjectsToUser([alpha, beta, shared], 'u3', [])).toEqual([]);
  });

  it('treats a project with no populated members as having none', () => {
    const orphan = project('orphan', []);
    expect(scopeProjectsToUser([orphan], 'u1', [])).toEqual([]);
  });
});

describe('userCategoryOptions', () => {
  function entry(userId: string, category: string) {
    return { userId, category } as { userId: string; category: string };
  }

  it('lists only the categories the selected user logged, sorted', () => {
    const entries = [
      entry('u1', 'Meetings'),
      entry('u1', 'Development'),
      entry('u2', 'Support'),
    ];
    expect(userCategoryOptions(entries as never, 'u1')).toEqual([
      'Development',
      'Meetings',
    ]);
  });

  it('dedupes repeated categories', () => {
    const entries = [entry('u1', 'Development'), entry('u1', 'Development')];
    expect(userCategoryOptions(entries as never, 'u1')).toEqual([
      'Development',
    ]);
  });

  it('ignores blank categories', () => {
    const entries = [entry('u1', '  '), entry('u1', 'Development')];
    expect(userCategoryOptions(entries as never, 'u1')).toEqual([
      'Development',
    ]);
  });

  it('returns nothing when the user logged no entries', () => {
    expect(userCategoryOptions([entry('u2', 'Support')] as never, 'u1')).toEqual(
      [],
    );
  });
});

describe('narrowToProject', () => {
  const projects = [project('a', []), project('b', [])];

  it('returns only the picked project', () => {
    expect(narrowToProject(projects, 'b').map((p) => p.id)).toEqual(['b']);
  });

  it('ignores an empty or unknown id', () => {
    expect(narrowToProject(projects, undefined)).toBe(projects);
    expect(narrowToProject(projects, 'zzz')).toBe(projects);
  });
});

describe('buildProjectUserIds', () => {
  it('includes members and anyone who logged time on the project', () => {
    const entry = new TimeSheetEntry();
    entry.projectId = 'a';
    entry.userId = 'former';
    const map = buildProjectUserIds([project('a', ['u1'])], [entry]);
    expect([...(map.get('a') ?? [])]).toEqual(['u1', 'former']);
  });
});
