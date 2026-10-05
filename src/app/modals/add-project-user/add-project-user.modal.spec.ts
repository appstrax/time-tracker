import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ProjectUserRole, User } from '@models';

import { AddProjectUserModal } from './add-project-user.modal';

describe('AddProjectUserModal', () => {
  let component: AddProjectUserModal;
  let fixture: ComponentFixture<AddProjectUserModal>;
  let activeModal: jasmine.SpyObj<NgbActiveModal>;

  function makeUser(id: string, name: string): User {
    const user = new User();
    user.id = id;
    user.name = name;
    user.surname = 'Tester';
    user.email = `${name.toLowerCase()}@example.com`;
    return user;
  }

  const ada = makeUser('user-1', 'Ada');
  const grace = makeUser('user-2', 'Grace');

  beforeEach(async () => {
    activeModal = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', [
      'close',
      'dismiss',
    ]);

    await TestBed.configureTestingModule({
      imports: [AddProjectUserModal],
      providers: [
        provideZonelessChangeDetection(),
        { provide: NgbActiveModal, useValue: activeModal },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddProjectUserModal);
    component = fixture.componentInstance;
    component.users = [ada, grace];
    fixture.detectChanges();
  });

  it('filters the users it was given by name and email', () => {
    component.onSearchTermChange('grace@');

    expect(component.searchResults().map((user) => user.id)).toEqual([
      'user-2',
    ]);
  });

  it('selects a user and closes the results', () => {
    component.onSearchFocus();
    component.onUserSelect(ada);

    expect(component.selectedUser()).toBe(ada);
    expect(component.isSearchOpen()).toBeFalse();
  });

  it('clears the selected user', () => {
    component.onUserSelect(ada);
    component.clearSelectedUser();

    expect(component.selectedUser()).toBeNull();
  });

  it('defaults the role to contributor', () => {
    expect(component.role()).toBe(ProjectUserRole.CONTRIBUTOR);
  });

  it('closes with the chosen user and role', () => {
    component.onUserSelect(ada);
    component.role.set(ProjectUserRole.APPROVER);

    component.onAddClick();

    expect(activeModal.close).toHaveBeenCalledWith({
      user: ada,
      role: ProjectUserRole.APPROVER,
    });
  });

  it('does nothing when no user is selected', () => {
    component.onAddClick();

    expect(activeModal.close).not.toHaveBeenCalled();
  });

  it('dismisses on cancel', () => {
    component.close();

    expect(activeModal.dismiss).toHaveBeenCalled();
  });

  it('disables the add button until a user is selected', () => {
    const addButton = () =>
      fixture.debugElement.query(By.css('.add-user-button'))
        .nativeElement as HTMLButtonElement;

    expect(addButton().disabled).toBeTrue();

    component.onUserSelect(ada);
    fixture.detectChanges();

    expect(addButton().disabled).toBeFalse();
  });

  it('renders the selected user with a remove control', () => {
    component.onUserSelect(ada);
    fixture.detectChanges();

    const remove = fixture.debugElement.query(
      By.css('.selected-user-pill .selected-user-remove'),
    );
    expect(remove).not.toBeNull();

    (remove.nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.selectedUser()).toBeNull();
    expect(
      fixture.debugElement.query(By.css('.selected-user-pill')),
    ).toBeNull();
  });
});
