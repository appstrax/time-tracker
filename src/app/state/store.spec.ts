import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { User } from '@models';

import { ProjectAccessStore } from './project-access.store';
import { ProjectsStore } from './projects.store';
import { RouteStore } from './route.store';
import { Store } from './store';
import { UserStore } from './user.store';

describe('Store', () => {
  let store: Store;
  let fetchUserProjects: jasmine.Spy;
  let refresh: jasmine.Spy;

  beforeEach(() => {
    const me = new User();
    me.id = 'me';
    fetchUserProjects = jasmine.createSpy('fetchUserProjects').and.resolveTo();
    refresh = jasmine.createSpy('refresh').and.resolveTo({});

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: UserStore,
          useValue: { initialize: async () => undefined, user: signal(me) },
        },
        { provide: ProjectsStore, useValue: { fetchUserProjects } },
        { provide: ProjectAccessStore, useValue: { refresh } },
        { provide: RouteStore, useValue: {} },
      ],
    });
    store = TestBed.inject(Store);
  });

  it('loads projects and memberships for the signed-in user', async () => {
    await store.init();
    expect(fetchUserProjects).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledOnceWith('me');
  });

  it('resolves and logs when only the membership refresh fails', async () => {
    const error = new Error('memberships down');
    refresh.and.rejectWith(error);
    spyOn(console, 'error');
    await expectAsync(store.init()).toBeResolved();
    expect(fetchUserProjects).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      'Failed to refresh project memberships',
      error,
    );
  });

  it('still rejects when the projects fetch fails', async () => {
    fetchUserProjects.and.rejectWith(new Error('projects down'));
    await expectAsync(store.init()).toBeRejectedWithError('projects down');
  });
});
