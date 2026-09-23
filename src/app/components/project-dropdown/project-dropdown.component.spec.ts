import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Project } from '@models';
import { Store } from '@state';

import { ProjectDropdownComponent } from './project-dropdown.component';

describe('ProjectDropdownComponent', () => {
  let component: ProjectDropdownComponent;
  let fixture: ComponentFixture<ProjectDropdownComponent>;
  let projectsSignal: ReturnType<typeof signal<Project[]>>;

  beforeEach(async () => {
    projectsSignal = signal<Project[]>([
      { id: '1', name: 'Alpha Project' } as Project,
      { id: '2', name: 'Beta Portal' } as Project,
    ]);

    await TestBed.configureTestingModule({
      imports: [ProjectDropdownComponent],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: Store,
          useValue: {
            projects: {
              projects: projectsSignal,
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters projects by name as the user types', () => {
    component.projectSearchTerm.set('beta');
    expect(component.filteredProjects().map((p) => p.name)).toEqual([
      'Beta Portal',
    ]);
  });

  it('shows the null option when its label matches the search', () => {
    component.allowNull = true;
    component.nullOptionLabel = 'All projects';
    component.projectSearchTerm.set('all');
    expect(component.shouldShowNullOption()).toBe(true);
  });

  it('closes when clicking outside the dropdown', () => {
    component.isProjectDropdownOpen = true;
    component.onDocumentClick(new MouseEvent('click'));
    expect(component.isProjectDropdownOpen).toBe(false);
  });

  it('shows a no-results message when search matches nothing', () => {
    component.projectSearchTerm.set('zzz');
    expect(component.emptyListMessage()).toBe('No projects match your search');
  });

  it('shows a no-projects message when the list is empty and search is blank', () => {
    projectsSignal.set([]);
    component.projectSearchTerm.set('');
    expect(component.emptyListMessage()).toBe('No projects available');
  });

  it('stops escape from bubbling when closing the search field', () => {
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    const stopPropagation = spyOn(event, 'stopPropagation');
    const preventDefault = spyOn(event, 'preventDefault');

    component.isProjectDropdownOpen = true;
    component.onSearchEscape(event);

    expect(stopPropagation).toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalled();
    expect(component.isProjectDropdownOpen).toBe(false);
  });
});
