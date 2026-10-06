import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { patchState } from '@ngrx/signals';

import { Project, TimeSheetEntry } from '@models';
import { Store } from '@state';
import { clearStoredTimeSheetFilterProjectId } from '@utils';

import { TimeSheetPage } from './time-sheet.page';

function makeProject(id: string): Project {
  const project = new Project();
  project.id = id;
  project.name = id;
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

  describe('categories', () => {
    function entry(projectId: string, category: string): TimeSheetEntry {
      const item = makeSavedEntry(projectId);
      item.category = category;
      return item;
    }

    function setEntries(entries: TimeSheetEntry[]): void {
      (
        component as unknown as {
          entries: { set(value: TimeSheetEntry[]): void };
        }
      ).entries.set(entries);
      fixture.detectChanges();
    }

    it('limits week category suggestions to the filtered project', () => {
      const projectA = makeProject('project-a');
      const projectB = makeProject('project-b');
      patchProjectsState({
        projects: [projectA, projectB],
        fetchedAt: new Date(),
      });

      setEntries([
        entry(projectA.id, 'Design'),
        entry(projectB.id, 'Support'),
        entry(projectA.id, '  '),
      ]);

      component.onFilterProjectSelected(null);
      expect(component.categories()).toEqual(['Design', 'Support']);

      component.onFilterProjectSelected(projectA);
      expect(component.categories()).toEqual(['Design']);
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
});
