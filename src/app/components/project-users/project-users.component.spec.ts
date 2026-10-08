import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Project, ProjectUser, ProjectUserRole, User } from '@models';
import { ProjectUserService, ToastService, UsersService } from '@services';
import { Store } from '@state';

import { ProjectUsersComponent } from './project-users.component';

describe('ProjectUsersComponent', () => {
  let component: ProjectUsersComponent;
  let fixture: ComponentFixture<ProjectUsersComponent>;
  let usersService: jasmine.SpyObj<UsersService>;
  let projectUserService: jasmine.SpyObj<ProjectUserService>;
  let modalService: jasmine.SpyObj<NgbModal>;
  let toast: jasmine.SpyObj<ToastService>;

  function makeUser(id: string, name: string): User {
    const user = new User();
    user.id = id;
    user.name = name;
    user.surname = 'Tester';
    user.email = `${id}@example.com`;
    return user;
  }

  const ada = makeUser('user-1', 'Ada');
  const grace = makeUser('user-2', 'Grace');

  function stubModalResult(result: Promise<unknown>): { users: User[] } {
    const componentInstance = { users: [] as User[] };
    modalService.open.and.returnValue({ componentInstance, result } as any);
    return componentInstance;
  }

  async function createComponent(members: ProjectUser[] = []) {
    usersService.fetchUsers.and.resolveTo([ada, grace]);
    projectUserService.findByProjectId.and.resolveTo(members);

    fixture = TestBed.createComponent(ProjectUsersComponent);
    component = fixture.componentInstance;
    const project = new Project();
    project.id = 'project-1';
    component.project = project;
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    usersService = jasmine.createSpyObj<UsersService>('UsersService', [
      'fetchUsers',
      'findByUserIds',
    ]);
    usersService.findByUserIds.and.resolveTo([]);

    projectUserService = jasmine.createSpyObj<ProjectUserService>(
      'ProjectUserService',
      ['findByProjectId', 'save', 'delete'],
    );
    projectUserService.save.and.callFake((projectUser: ProjectUser) =>
      Promise.resolve(
        Object.assign(new ProjectUser(), projectUser, {
          id: `pu-${projectUser.userId}`,
        }),
      ),
    );

    modalService = jasmine.createSpyObj<NgbModal>('NgbModal', ['open']);
    toast = jasmine.createSpyObj<ToastService>('ToastService', [
      'success',
      'error',
    ]);

    await TestBed.configureTestingModule({
      imports: [ProjectUsersComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: UsersService, useValue: usersService },
        { provide: ProjectUserService, useValue: projectUserService },
        { provide: NgbModal, useValue: modalService },
        { provide: ToastService, useValue: toast },
        {
          provide: Store,
          useValue: {
            user: { user: () => null },
            projects: { fetchUserProjects: () => Promise.resolve() },
          },
        },
      ],
    }).compileComponents();
  });

  it('opens the add-user dialog from the card header button', async () => {
    await createComponent();
    stubModalResult(Promise.reject('dismissed'));

    const button = fixture.debugElement.query(By.css('.add-user-button'))
      .nativeElement as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(modalService.open).toHaveBeenCalled();
  });

  it('offers only users who are not already on the project', async () => {
    const existing = new ProjectUser();
    existing.id = 'pu-1';
    existing.userId = 'user-1';
    existing.role = ProjectUserRole.CONTRIBUTOR;
    await createComponent([existing]);

    const modalInstance = stubModalResult(Promise.reject('dismissed'));
    await component.onAddUserClick();

    expect(modalInstance.users.map((user) => user.id)).toEqual(['user-2']);
  });

  it('adds the user the dialog returns, with the chosen role', async () => {
    await createComponent();
    stubModalResult(
      Promise.resolve({ user: grace, role: ProjectUserRole.MANAGER }),
    );

    await component.onAddUserClick();

    const [savedProjectUser] = projectUserService.save.calls.mostRecent().args;
    expect(savedProjectUser.userId).toBe('user-2');
    expect(savedProjectUser.role).toBe(ProjectUserRole.MANAGER);
    expect(component.members().length).toBe(1);
    expect(toast.success).toHaveBeenCalledWith('Project user added', 'Success');
  });

  it('adds nothing when the dialog is dismissed', async () => {
    await createComponent();
    stubModalResult(Promise.reject('dismissed'));

    await component.onAddUserClick();

    expect(projectUserService.save).not.toHaveBeenCalled();
    expect(component.members().length).toBe(0);
  });

  it('surfaces a failed add without changing the member list', async () => {
    await createComponent();
    projectUserService.save.and.rejectWith(new Error('Server said no'));
    stubModalResult(
      Promise.resolve({ user: grace, role: ProjectUserRole.CONTRIBUTOR }),
    );

    await component.onAddUserClick();

    expect(component.members().length).toBe(0);
    expect(component.error()).toBe('Server said no');
    expect(toast.error).toHaveBeenCalledWith('Server said no', 'Error');
  });

  async function createComponentWithMember() {
    const existing = new ProjectUser();
    existing.id = 'pu-1';
    existing.userId = 'user-1';
    existing.role = ProjectUserRole.CONTRIBUTOR;
    await createComponent([existing]);
  }

  it('drops the labelled actions column header', async () => {
    await createComponentWithMember();

    const headers = fixture.debugElement
      .queryAll(By.css('thead th'))
      .map((th) => th.nativeElement as HTMLElement);

    expect(headers.map((th) => th.textContent?.trim())).toEqual([
      'User',
      'Email',
      'Role',
      'Actions',
    ]);

    // The last header keeps its label for screen readers only.
    const actionsHeader = headers[headers.length - 1];
    expect(actionsHeader.querySelector('.visually-hidden')).not.toBeNull();
    expect(actionsHeader.childNodes.length).toBe(1);
  });

  it('removes a member from a cross icon rather than a button', async () => {
    await createComponentWithMember();

    expect(
      fixture.debugElement.query(By.css('.btn-outline-danger')),
    ).toBeNull();

    const action = fixture.debugElement.query(By.css('.member-action--remove'));
    expect(action).not.toBeNull();

    const element = action.nativeElement as HTMLButtonElement;
    expect(element.getAttribute('aria-label')).toBe('Remove Ada Tester');
    expect(element.querySelector('i.bi-x-lg')).not.toBeNull();

    modalService.open.and.returnValue({ componentInstance: {} } as any);
    element.click();

    expect(modalService.open).toHaveBeenCalled();
  });

  it('swaps the cross for a spinner while the member is busy', async () => {
    await createComponentWithMember();
    component.saving.set('user-1');
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('.member-action--remove')),
    ).toBeNull();
    expect(
      fixture.debugElement.query(By.css('.member-action-spinner')),
    ).not.toBeNull();
  });

  it('offers the dialog from the empty state too', async () => {
    await createComponent();

    const buttons = fixture.debugElement.queryAll(By.css('.add-user-button'));
    expect(buttons.length).toBe(2);
  });
});
