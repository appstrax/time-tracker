import { WritableSignal, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Project, ProjectUser, ProjectUserRole, User, UserRole } from '@models';
import { ProjectUserService } from '@services';

import { ProjectAccessStore } from './project-access.store';
import { ProjectsStore } from './projects.store';
import { UserStore } from './user.store';

function makeProject(id: string): Project {
  const project = new Project();
  project.id = id;
  project.name = id;
  return project;
}

function row(projectId: string, role: ProjectUserRole): ProjectUser {
  const pu = new ProjectUser();
  pu.projectId = projectId;
  pu.userId = 'me';
  pu.role = role;
  return pu;
}

describe('ProjectAccessStore', () => {
  let store: InstanceType<typeof ProjectAccessStore>;
  let findByUserId: jasmine.Spy;
  let currentUser: WritableSignal<User | null>;

  const rows = () => [
    row('a', ProjectUserRole.CONTRIBUTOR),
    row('b', ProjectUserRole.VIEWER),
    row('c', ProjectUserRole.MANAGER),
  ];

  beforeEach(() => {
    const me = new User();
    me.id = 'me';
    me.role = UserRole.USER;
    currentUser = signal<User | null>(me);
    findByUserId = jasmine.createSpy('findByUserId').and.callFake(async () => rows());

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ProjectUserService, useValue: { findByUserId } },
        { provide: UserStore, useValue: { user: currentUser } },
        {
          provide: ProjectsStore,
          useValue: {
            projects: signal([makeProject('a'), makeProject('b'), makeProject('c')]),
          },
        },
      ],
    });
    store = TestBed.inject(ProjectAccessStore);
  });

  it('derives permissions from memberships', async () => {
    await store.refresh('me');
    expect(store.logProjects().map((p) => p.id)).toEqual(['a', 'c']);
    expect(store.analyticsProjects().map((p) => p.id)).toEqual(['b', 'c']);
    expect(store.can('c', 'approve')).toBeTrue();
    expect(store.can('b', 'approve')).toBeFalse();
    expect(store.isLogRestricted('b')).toBeTrue();
    expect(store.isLogRestricted('left-project')).toBeFalse();
  });

  it('gives a platform admin all analytics projects and no log restriction', async () => {
    currentUser.update((u) => {
      const admin = new User();
      admin.id = u!.id;
      admin.role = UserRole.ADMIN;
      return admin;
    });
    // Admin is a member of a and b only: logs there, but sees analytics everywhere.
    findByUserId.and.resolveTo([
      row('a', ProjectUserRole.CONTRIBUTOR),
      row('b', ProjectUserRole.VIEWER),
    ]);
    await store.refresh('me');
    expect(store.platformAdmin()).toBeTrue();
    expect(store.analyticsProjects().map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(store.logProjects().map((p) => p.id)).toEqual(['a', 'b']);
    expect(store.isLogRestricted('b')).toBeFalse();
  });

  it('shares one in-flight request between concurrent refreshes', async () => {
    await Promise.all([store.refresh('me'), store.refresh('me')]);
    expect(findByUserId).toHaveBeenCalledTimes(1);
  });

  it('picks up a role change on the next refresh', async () => {
    await store.refresh('me');
    expect(store.can('b', 'approve')).toBeFalse();
    findByUserId.and.resolveTo([row('b', ProjectUserRole.MANAGER)]);
    await store.refresh('me');
    expect(findByUserId).toHaveBeenCalledTimes(2);
    expect(store.can('b', 'approve')).toBeTrue();
    expect(store.memberships()).toEqual({ b: ProjectUserRole.MANAGER });
  });

  it('fails closed: clears memberships on failure rather than keeping a stale, possibly revoked role', async () => {
    await store.refresh('me');
    findByUserId.and.rejectWith(new Error('boom'));
    await expectAsync(store.refresh('me')).toBeRejected();
    expect(store.memberships()).toEqual({});
    expect(store.can('c', 'approve')).toBeFalse();

    findByUserId.and.resolveTo([row('a', ProjectUserRole.VIEWER)]);
    await store.refresh('me');
    expect(store.memberships()).toEqual({ a: 'viewer' });
  });

  it('clear() empties memberships', async () => {
    await store.refresh('me');
    store.clear();
    expect(store.memberships()).toEqual({});
  });

  it('treats a row with no role as no access', async () => {
    const roleless = new ProjectUser();
    roleless.projectId = 'a';
    roleless.userId = 'me';
    findByUserId.and.resolveTo([roleless]);
    await store.refresh('me');
    expect(store.logProjects()).toEqual([]);
    expect(store.analyticsProjects()).toEqual([]);
    expect(store.needsAnalyticsLanding()).toBeFalse();
    expect(store.hasAnalyticsAccess()).toBeFalse();
  });

  it('lets the first row win when a project has duplicate rows', async () => {
    findByUserId.and.resolveTo([
      row('a', ProjectUserRole.VIEWER),
      row('a', ProjectUserRole.CONTRIBUTOR),
    ]);
    await store.refresh('me');
    expect(store.memberships()).toEqual({ a: 'viewer' });
  });

  it('does not share a pending request across different users', async () => {
    let releaseA!: (value: ProjectUser[]) => void;
    findByUserId.and.returnValues(
      new Promise<ProjectUser[]>((resolve) => (releaseA = resolve)),
      Promise.resolve([row('b', ProjectUserRole.MANAGER)]),
    );
    const pendingA = store.refresh('userA');
    await store.refresh('userB');
    expect(findByUserId).toHaveBeenCalledTimes(2);
    expect(findByUserId.calls.argsFor(1)).toEqual(['userB']);
    // A's late response must not overwrite B's memberships.
    releaseA([row('a', ProjectUserRole.CONTRIBUTOR)]);
    await pendingA;
    expect(store.memberships()).toEqual({ b: ProjectUserRole.MANAGER });
  });

  it('keeps the same memberships object when a refresh changes nothing', async () => {
    await store.refresh('me');
    const memberships = store.memberships();
    const logProjects = store.logProjects();
    const analyticsProjects = store.analyticsProjects();
    await store.refresh('me');
    expect(findByUserId).toHaveBeenCalledTimes(2);
    expect(store.memberships()).toBe(memberships);
    expect(store.logProjects()).toBe(logProjects);
    expect(store.analyticsProjects()).toBe(analyticsProjects);
  });

  it('replaces memberships when only a role changes', async () => {
    await store.refresh('me');
    const memberships = store.memberships();
    findByUserId.and.resolveTo([
      row('a', ProjectUserRole.CONTRIBUTOR),
      row('b', ProjectUserRole.MANAGER),
      row('c', ProjectUserRole.MANAGER),
    ]);
    await store.refresh('me');
    expect(store.memberships()).not.toBe(memberships);
    expect(store.memberships()).toEqual({ a: 'contributor', b: 'manager', c: 'manager' });
  });

  describe('claimStaleWarning()', () => {
    it('grants the stale-access warning once until a refresh succeeds', async () => {
      expect(store.claimStaleWarning()).toBeTrue();
      expect(store.claimStaleWarning()).toBeFalse();
      findByUserId.and.rejectWith(new Error('down'));
      await expectAsync(store.refresh('me')).toBeRejected();
      expect(store.claimStaleWarning()).toBeFalse();
      findByUserId.and.callFake(async () => rows());
      await store.refresh('me');
      expect(store.claimStaleWarning()).toBeTrue();
    });

    it('is granted again after clear()', () => {
      expect(store.claimStaleWarning()).toBeTrue();
      store.clear();
      expect(store.claimStaleWarning()).toBeTrue();
    });
  });

  it('ignores a response that lands after clear()', async () => {
    let release!: (value: ProjectUser[]) => void;
    findByUserId.and.returnValue(
      new Promise<ProjectUser[]>((resolve) => (release = resolve)),
    );
    const pending = store.refresh('me');
    store.clear();
    release(rows());
    await pending;
    expect(store.memberships()).toEqual({});
  });
});
