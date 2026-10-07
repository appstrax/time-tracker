import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { UserRole } from '@models';
import { Store } from '@state';

import { SideNavExpandedComponent } from './side-nav-expanded.component';

describe('SideNavExpandedComponent', () => {
  let fixture: ComponentFixture<SideNavExpandedComponent>;

  const needsAnalyticsLanding = signal(false);
  const hasAnalyticsAccess = signal(false);
  const platformAdmin = signal(false);
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
    hasAnalyticsAccess.set(false);
    platformAdmin.set(false);
    user.set({ role: UserRole.USER });

    TestBed.configureTestingModule({
      imports: [SideNavExpandedComponent],
      providers: [
        provideRouter([]),
        {
          provide: Store,
          useValue: {
            access: { needsAnalyticsLanding, hasAnalyticsAccess, platformAdmin },
            user: { user },
          },
        },
      ],
    });
  });

  it('shows only Analytics for a viewer-only user', () => {
    needsAnalyticsLanding.set(true);
    hasAnalyticsAccess.set(true);
    render();

    expect(labels()).toEqual(['Analytics']);
  });

  it('shows only Home and Time Sheets for a contributor', () => {
    render();

    expect(labels()).toEqual(['Home', 'Time Sheets']);
  });

  it('shows Home, Time Sheets and Analytics for mixed roles', () => {
    hasAnalyticsAccess.set(true);
    render();

    expect(labels()).toEqual(['Home', 'Time Sheets', 'Analytics']);
  });

  it('shows all four links for a platform admin', () => {
    platformAdmin.set(true);
    user.set({ role: UserRole.ADMIN });
    hasAnalyticsAccess.set(true);
    render();

    expect(labels()).toEqual(['Home', 'Time Sheets', 'Analytics', 'Projects']);
  });
});
