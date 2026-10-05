import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Project, TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, UsersService } from '@services';
import { Store } from '@state';

import { ProjectAnalyticsPage } from './project-analytics.page';

function makeUser(id: string): User {
  const user = new User();
  user.id = id;
  user.name = id;
  return user;
}

function makeEntry(
  id: string,
  userId: string,
  category: string,
): TimeSheetEntry {
  const entry = new TimeSheetEntry();
  entry.id = id;
  entry.projectId = 'alpha';
  entry.userId = userId;
  entry.category = category;
  entry.hours = 1;
  entry.date = new Date(2026, 0, 15);
  entry.approved = true;
  return entry;
}

describe('ProjectAnalyticsPage', () => {
  let component: ProjectAnalyticsPage;
  let fixture: ComponentFixture<ProjectAnalyticsPage>;

  beforeEach(async () => {
    const alpha = new Project();
    alpha.id = 'alpha';
    alpha.name = 'Alpha';
    alpha.categories = ['Development', 'Meetings'];
    alpha.users = [makeUser('u1'), makeUser('u2')];

    const storeStub = {
      projects: {
        projects: signal<Project[]>([alpha]),
        fetchedAt: signal<Date | null>(new Date()),
      },
    };

    await TestBed.configureTestingModule({
      imports: [ProjectAnalyticsPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: Store, useValue: storeStub },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            snapshot: { paramMap: new Map([['projectId', 'alpha']]) },
          },
        },
        {
          provide: TimeSheetEntryService,
          useValue: {
            findByProjectId: async () => [
              makeEntry('e1', 'u1', 'Development'),
              makeEntry('e2', 'u2', 'Support'),
              makeEntry('e3', 'exmember', 'Admin'),
            ],
          },
        },
        {
          provide: UsersService,
          useValue: {
            fetchUsers: async () => [
              makeUser('u1'),
              makeUser('u2'),
              makeUser('exmember'),
              makeUser('outsider'),
            ],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectAnalyticsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offers this project’s members and anyone who logged time on it', () => {
    expect(component.filterUsers().map((user) => user.id)).toEqual([
      'u1',
      'u2',
      'exmember',
    ]);
  });

  it('leaves out users with neither membership nor hours here', () => {
    expect(component.filterUsers().map((user) => user.id)).not.toContain(
      'outsider',
    );
  });

  it('keeps a filtered non-member visible so the applied filter is shown', () => {
    component.filter.set({ userId: 'outsider' });
    expect(component.filterUsers().map((user) => user.id)).toEqual([
      'u1',
      'u2',
      'exmember',
      'outsider',
    ]);
  });

  it('lists every category when no team member is selected', () => {
    component.filter.set({});
    expect(component.categories()).toEqual([
      'Development',
      'Meetings',
      'Admin',
      'Support',
    ]);
  });

  it('lists only the selected member’s categories', () => {
    component.filter.set({ userId: 'u2' });
    expect(component.categories()).toEqual(['Support']);
  });
});
