import {
  WritableSignal,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Project, TimeSheetEntry, User, UserRole } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { Store } from '@state';
import {
  clearStoredTimeSheetFilterProjectId,
  getStoredTimeSheetFilterProjectId,
} from '@utils';

import { HomePage } from './home.page';

function makeProject(id: string, memberIds: string[]): Project {
  const project = new Project();
  project.id = id;
  project.name = id;
  project.users = memberIds.map((memberId) => {
    const user = new User();
    user.id = memberId;
    return user;
  });
  return project;
}

function makeEntry(
  id: string,
  projectId: string,
  hours: number,
  approved: boolean,
): TimeSheetEntry {
  const entry = new TimeSheetEntry();
  entry.id = id;
  entry.projectId = projectId;
  entry.userId = 'me';
  entry.hours = hours;
  entry.approved = approved;
  entry.date = new Date();
  return entry;
}

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let findByUserAndDateRange: jasmine.Spy;
  let currentUser: WritableSignal<User | null>;
  let storeProjects: WritableSignal<Project[]>;
  let logProjects: WritableSignal<Project[]>;

  beforeEach(async () => {
    const me = new User();
    me.id = 'me';
    me.role = UserRole.ADMIN;
    currentUser = signal<User | null>(me);

    findByUserAndDateRange = jasmine
      .createSpy('findByUserAndDateRange')
      .and.resolveTo([
        makeEntry('e1', 'alpha', 3, true),
        makeEntry('e2', 'alpha', 1, false),
        makeEntry('e3', 'beta', 2, true),
      ]);

    // The store holds every project; access.logProjects is the loggable subset.
    storeProjects = signal<Project[]>([
      makeProject('alpha', ['me']),
      makeProject('beta', ['me']),
      makeProject('gamma', ['someone-else']),
    ]);

    logProjects = signal<Project[]>([storeProjects()[0], storeProjects()[1]]);

    const storeStub = {
      user: { user: currentUser, loading: signal(false) },
      projects: {
        projects: storeProjects,
        loading: signal(false),
        fetchedAt: signal<Date | null>(new Date()),
      },
      access: { logProjects },
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: Store, useValue: storeStub },
        { provide: TimeSheetEntryService, useValue: { findByUserAndDateRange } },
        { provide: ToastService, useValue: { error: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads only the signed-in user’s entries', () => {
    expect(findByUserAndDateRange).toHaveBeenCalled();
    expect(findByUserAndDateRange.calls.mostRecent().args[0]).toBe('me');
  });

  it('totals the user’s approved and pending hours', () => {
    expect(component.totals().total).toBe(6);
    expect(component.totals().approved).toBe(5);
    expect(component.totals().pending).toBe(1);
  });

  it('builds a project row per project, sorted by hours', () => {
    expect(component.rows().map((row) => row.id)).toEqual(['alpha', 'beta']);
  });

  it('filters the project list by the search term without changing the totals', () => {
    component.projectSearch.set('alpha');

    expect(component.listedRows().map((row) => row.id)).toEqual(['alpha']);
    expect(component.rows().map((row) => row.id)).toEqual(['alpha', 'beta']);
    expect(component.totals().total).toBe(6);
  });

  it('limits an admin to the projects they are assigned to', () => {
    expect(component.projects().map((project) => project.id)).toEqual([
      'alpha',
      'beta',
    ]);
  });

  it('lists every loggable project, even with no time logged', () => {
    logProjects.set([makeProject('alpha', []), makeProject('delta', [])]);

    expect(component.projects().map((project) => project.id)).toEqual([
      'alpha',
      'delta',
    ]);
    expect(component.rows().map((row) => row.id)).toEqual(['alpha', 'delta']);
    expect(component.rows().find((row) => row.id === 'delta')?.hours).toBe(0);
  });

  it('applies the status filter to the totals', () => {
    component.onFilterChange({ status: 'pending' });
    expect(component.totals().total).toBe(1);
  });

  it('ignores a userId in the URL filter', () => {
    component.onFilterChange({ userId: 'someone-else' });
    expect(component.filter().userId).toBeUndefined();
    expect(component.totals().total).toBe(6);
  });

  it('leaves hours on a project outside the list out of the totals', () => {
    // gamma is in the store but the user cannot log time on it (e.g. viewer).
    component.entries.update((entries) => [
      ...entries,
      makeEntry('e4', 'gamma', 4, true),
    ]);
    expect(component.totals().total).toBe(6);
    expect(
      component.filteredEntries().every((entry) => entry.projectId !== 'gamma'),
    ).toBeTrue();
    const rowHours = component
      .rows()
      .reduce((sum, row) => sum + row.hours, 0);
    expect(rowHours).toBe(component.totals().total);
  });

  it('ignores a category in the URL filter', () => {
    component.onFilterChange({ category: 'Meetings' });
    expect(component.filter().category).toBeUndefined();
    expect(component.totals().total).toBe(6);
  });

  it('keeps the project list steady while entries reload', () => {
    // The load effect empties the entries on every range change.
    component.entries.set([]);
    expect(component.projects().map((project) => project.id)).toEqual([
      'alpha',
      'beta',
    ]);
    expect(component.hasProjects()).toBeTrue();
  });

  it('opens the time sheet on the clicked project', () => {
    clearStoredTimeSheetFilterProjectId();
    component.rememberProject('beta');
    expect(getStoredTimeSheetFilterProjectId()).toBe('beta');
    clearStoredTimeSheetFilterProjectId();
  });

  it('does not offer a team member filter', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).not.toContain('Team member');
  });
});
