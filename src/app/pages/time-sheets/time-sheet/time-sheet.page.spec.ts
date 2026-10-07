import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { patchState } from '@ngrx/signals';

import { Project, ProjectUserRole, TimeSheetEntry, User, UserRole } from '@models';
import { Store } from '@state';
import { clearStoredTimeSheetFilterProjectId } from '@utils';

import { TimeSheetPage } from './time-sheet.page';

function makeProject(id: string, memberIds: string[] = []): Project {
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

function makeSavedEntry(projectId: string): TimeSheetEntry {
  const entry = new TimeSheetEntry();
  entry.projectId = projectId;
  return entry;
}

describe('TimeSheetPage', () => {
  let component: TimeSheetPage;
  let fixture: ComponentFixture<TimeSheetPage>;
  let store: Store;

  // ProjectsStore's public signals are typed read-only; patchState still works
  // at runtime via its internal state source, so the cast is confined here.
  function patchProjectsState(state: {
    projects: Project[];
    fetchedAt: Date | null;
  }): void {
    patchState(store.projects as never, state);
  }

  /** Re-creates the page the way navigating back to it does: a fresh component
   * instance reading whatever is in storage at that moment. */
  function recreateComponent(): void {
    fixture = TestBed.createComponent(TimeSheetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    clearStoredTimeSheetFilterProjectId();

    await TestBed.configureTestingModule({
      imports: [TimeSheetPage],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    })
    .compileComponents();

    store = TestBed.inject(Store);

    recreateComponent();
  });

  afterEach(() => {
    clearStoredTimeSheetFilterProjectId();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onTimeSheetEntrySaved', () => {
    it('keeps the filter on "all projects" when an entry is saved for a project while unfiltered', () => {
      const projectX = makeProject('project-x');
      patchProjectsState({
        projects: [projectX],
        fetchedAt: new Date(),
      });

      component.onFilterProjectSelected(null);
      expect(component.filterProject()).toBeNull();

      component.onTimeSheetEntrySaved(makeSavedEntry(projectX.id));

      expect(component.filterProject()).toBeNull();
    });

    it('adopts the saved entry\'s project when a different project was already the active filter', () => {
      const projectA = makeProject('project-a');
      const projectB = makeProject('project-b');
      patchProjectsState({
        projects: [projectA, projectB],
        fetchedAt: new Date(),
      });

      component.onFilterProjectSelected(projectA);
      expect(component.filterProject()?.id).toBe(projectA.id);

      component.onTimeSheetEntrySaved(makeSavedEntry(projectB.id));

      expect(component.filterProject()?.id).toBe(projectB.id);
    });

    it('keeps the filter when an entry is deleted rather than saved', () => {
      const projectA = makeProject('project-a');
      patchProjectsState({ projects: [projectA], fetchedAt: new Date() });

      component.onFilterProjectSelected(projectA);
      component.onTimeSheetEntrySaved(undefined);

      expect(component.filterProject()?.id).toBe(projectA.id);
    });
  });

  describe('filter persistence across page re-creation', () => {
    it('stays on "all projects" after saving an entry for a project', () => {
      const projectX = makeProject('project-x');

      component.onFilterProjectSelected(null);
      component.onTimeSheetEntrySaved(makeSavedEntry(projectX.id));

      recreateComponent();
      patchProjectsState({ projects: [projectX], fetchedAt: new Date() });

      expect(component.filterProject()).toBeNull();
    });

    it('restores a project filter the user explicitly selected', () => {
      const projectA = makeProject('project-a');
      patchProjectsState({ projects: [projectA], fetchedAt: new Date() });

      component.onFilterProjectSelected(projectA);

      recreateComponent();
      patchProjectsState({ projects: [projectA], fetchedAt: new Date() });

      expect(component.filterProject()?.id).toBe(projectA.id);
    });

    it('adopting a saved entry\'s project persists across re-creation', () => {
      const projectA = makeProject('project-a');
      const projectB = makeProject('project-b');
      patchProjectsState({
        projects: [projectA, projectB],
        fetchedAt: new Date(),
      });

      component.onFilterProjectSelected(projectA);
      component.onTimeSheetEntrySaved(makeSavedEntry(projectB.id));

      recreateComponent();
      patchProjectsState({
        projects: [projectA, projectB],
        fetchedAt: new Date(),
      });

      expect(component.filterProject()?.id).toBe(projectB.id);
    });
  });

  describe('project access', () => {
    function patchMemberships(memberships: Record<string, string>): void {
      patchState(store.access as never, { memberships });
    }

    function makeEntry(id: string, projectId: string): TimeSheetEntry {
      const entry = new TimeSheetEntry();
      entry.id = id;
      entry.projectId = projectId;
      entry.date = new Date();
      return entry;
    }

    function shownEntryIds(): string[] {
      return [...component.entriesByDate().values()].flat().map((e) => e.id);
    }

    beforeEach(() => {
      patchState(store.user as never, {
        user: { id: 'user-1', role: UserRole.USER } as User,
      });
      patchProjectsState({
        projects: [makeProject('mine'), makeProject('watched'), makeProject('left')],
        fetchedAt: new Date(),
      });
      patchMemberships({
        mine: ProjectUserRole.CONTRIBUTOR,
        watched: ProjectUserRole.VIEWER,
      });
    });

    it('offers only the projects the user can log time on in myProjects', () => {
      expect(component.myProjects().map((p) => p.id)).toEqual(['mine']);
    });

    it('keeps the unfiltered project list for colour lookups', () => {
      expect(component.projects().map((p) => p.id)).toEqual([
        'mine',
        'watched',
        'left',
      ]);
    });

    it('hides entries on a project where the user is restricted from logging time', () => {
      component.weekEntries.set([makeEntry('e1', 'mine'), makeEntry('e2', 'watched')]);

      expect(shownEntryIds()).toEqual(['e1']);
    });

    it('still shows entries on a project the user has left', () => {
      component.weekEntries.set([makeEntry('e1', 'mine'), makeEntry('e3', 'left')]);

      expect(shownEntryIds()).toEqual(['e1', 'e3']);
    });
  });
});
