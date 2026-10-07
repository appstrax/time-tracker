import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { UserRole } from '@models';
import { Store } from '@state';

import { SideNavExpandedComponent } from './side-nav-expanded.component';

describe('SideNavExpandedComponent', () => {
  let fixture: ComponentFixture<SideNavExpandedComponent>;

  const needsAnalyticsLanding = signal(false);
  const analyticsProjects = signal<unknown[]>([]);
  const user = signal<{ role: UserRole } | null>(null);

  const labels = (): string[] =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.menu .label'),
    ).map((el) => el.textContent?.trim() ?? '');

  const render = (): void => {
    fixture = TestBed.createComponent(SideNavExpandedComponent);
    fixture.detectChanges();
  };

  beforeEach(() => {
    needsAnalyticsLanding.set(false);
    analyticsProjects.set([]);
    user.set({ role: UserRole.USER });

    TestBed.configureTestingModule({
      imports: [SideNavExpandedComponent],
      providers: [
        provideRouter([]),
        {
          provide: Store,
          useValue: {
            access: { needsAnalyticsLanding, analyticsProjects },
            user: { user },
          },
        },
      ],
    });
  });

  it('shows only Analytics for a viewer-only user', () => {
    needsAnalyticsLanding.set(true);
    analyticsProjects.set([{ id: 'p1' }]);
    render();

    expect(labels()).toEqual(['Analytics']);
  });

  it('shows only Home and Time Sheets for a contributor', () => {
    render();

    expect(labels()).toEqual(['Home', 'Time Sheets']);
  });

  it('shows Home, Time Sheets and Analytics for mixed roles', () => {
    analyticsProjects.set([{ id: 'p1' }]);
    render();

    expect(labels()).toEqual(['Home', 'Time Sheets', 'Analytics']);
  });

  it('shows all four links for a platform admin', () => {
    user.set({ role: UserRole.ADMIN });
    render();

    expect(labels()).toEqual(['Home', 'Time Sheets', 'Analytics', 'Projects']);
  });
});
