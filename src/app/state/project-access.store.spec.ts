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
    row('c', ProjectUserRole.APPROVER),
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
    expect(store.logProjects().map((p) => p.id)).toEqual(['a']);
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
    await store.refresh('me');
    expect(store.platformAdmin()).toBeTrue();
    expect(store.analyticsProjects().map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(store.isLogRestricted('b')).toBeFalse();
  });

  it('shares one in-flight request between concurrent refreshes', async () => {
    await Promise.all([store.refresh('me'), store.refresh('me')]);
    expect(findByUserId).toHaveBeenCalledTimes(1);
  });

  it('picks up a role change on the next refresh', async () => {
    await store.refresh('me');
    expect(store.can('b', 'approve')).toBeFalse();
    findByUserId.and.resolveTo([row('b', ProjectUserRole.APPROVER)]);
    await store.refresh('me');
    expect(findByUserId).toHaveBeenCalledTimes(2);
    expect(store.can('b', 'approve')).toBeTrue();
    expect(store.memberships()).toEqual({ b: ProjectUserRole.APPROVER });
  });

  it('keeps previous memberships on failure and retries next time', async () => {
    await store.refresh('me');
    findByUserId.and.rejectWith(new Error('boom'));
    await expectAsync(store.refresh('me')).toBeRejected();
    expect(store.memberships()).toEqual({
      a: 'contributor',
      b: 'viewer',
      c: 'approver',
    });
    findByUserId.and.resolveTo([row('a', ProjectUserRole.VIEWER)]);
    await store.refresh('me');
    expect(store.memberships()).toEqual({ a: 'viewer' });
  });

  it('clear() empties memberships', async () => {
    await store.refresh('me');
    store.clear();
    expect(store.memberships()).toEqual({});
  });
});
