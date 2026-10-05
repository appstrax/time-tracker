import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Project, TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, UsersService } from '@services';
import { Store } from '@state';

import { AnalyticsPage } from './analytics.page';

function makeUser(id: string): User {
  const user = new User();
  user.id = id;
  user.name = id;
  return user;
}

function makeProject(id: string, memberIds: string[]): Project {
  const project = new Project();
  project.id = id;
  project.name = id;
  project.users = memberIds.map(makeUser);
  return project;
}

function makeEntry(
  id: string,
  projectId: string,
  userId: string,
  hours: number,
): TimeSheetEntry {
  const entry = new TimeSheetEntry();
  entry.id = id;
  entry.projectId = projectId;
  entry.userId = userId;
  entry.hours = hours;
  entry.date = new Date(2026, 0, 15);
  entry.approved = true;
  return entry;
}

describe('AnalyticsPage', () => {
  let component: AnalyticsPage;
  let fixture: ComponentFixture<AnalyticsPage>;

  const alpha = makeProject('alpha', ['u1']);
  const beta = makeProject('beta', ['u2']);
  /** u1 logged time here but is no longer a member. */
  const gamma = makeProject('gamma', ['u2']);

  beforeEach(async () => {
    const storeStub = {
      projects: {
        projects: signal<Project[]>([alpha, beta, gamma]),
        fetchedAt: signal<Date | null>(new Date()),
      },
    };

    await TestBed.configureTestingModule({
      imports: [AnalyticsPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: Store, useValue: storeStub },
        {
          provide: TimeSheetEntryService,
          useValue: {
            findByProjectId: async () => [
              makeEntry('e1', 'alpha', 'u1', 3),
              makeEntry('e2', 'beta', 'u2', 5),
              makeEntry('e3', 'gamma', 'u1', 1),
            ],
          },
        },
        {
          provide: UsersService,
          useValue: { fetchUsers: async () => [makeUser('u1'), makeUser('u2')] },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists every project when no team member is selected', () => {
    component.filter.set({});
    expect(component.rows().map((row) => row.id)).toEqual([
      'beta',
      'alpha',
      'gamma',
    ]);
  });

  it('lists the selected team member’s projects', () => {
    component.filter.set({ userId: 'u2' });
    expect(component.rows().map((row) => row.id)).toEqual(['beta', 'gamma']);
  });

  it('keeps a project the member logged time on before being removed', () => {
    component.filter.set({ userId: 'u1' });
    expect(component.rows().map((row) => row.id)).toEqual(['alpha', 'gamma']);
  });

  it('excludes entries from projects unrelated to the selected member', () => {
    component.filter.set({ userId: 'u1' });
    expect(component.filteredEntries().map((entry) => entry.id)).toEqual([
      'e1',
      'e3',
    ]);
  });

  it('totals only the hours of the visible projects', () => {
    component.filter.set({ userId: 'u1' });
    expect(component.totals().total).toBe(4);
  });

  it('shows no projects for a member with no membership and no hours', () => {
    component.filter.set({ userId: 'u3' });
    expect(component.rows()).toEqual([]);
    expect(component.totals().total).toBe(0);
  });
});
