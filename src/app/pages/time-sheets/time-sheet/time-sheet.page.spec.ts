import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { patchState } from '@ngrx/signals';

import { Project } from '@models';
import { Store } from '@state';
import {
  clearStoredTimeSheetProjectId,
  storeTimeSheetProjectId,
} from '@utils';

import { TimeSheetPage } from './time-sheet.page';

function makeProject(id: string): Project {
  const project = new Project();
  project.id = id;
  project.name = id;
  return project;
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

  beforeEach(async () => {
    clearStoredTimeSheetProjectId();

    await TestBed.configureTestingModule({
      imports: [TimeSheetPage],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    })
    .compileComponents();

    store = TestBed.inject(Store);

    fixture = TestBed.createComponent(TimeSheetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    clearStoredTimeSheetProjectId();
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

      // Simulates TimeSheetEntryModal.onSaveTimeSheetEntry() remembering the
      // saved entry's project as the "last used project" for its own defaults.
      storeTimeSheetProjectId(projectX.id);

      component.onTimeSheetEntrySaved();

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

      storeTimeSheetProjectId(projectB.id);

      component.onTimeSheetEntrySaved();

      expect(component.filterProject()?.id).toBe(projectB.id);
    });
  });
});
