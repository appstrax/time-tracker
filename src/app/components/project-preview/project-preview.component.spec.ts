import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPreviewComponent } from './project-preview.component';

describe('ProjectPreviewComponent', () => {
  let component: ProjectPreviewComponent;
  let fixture: ComponentFixture<ProjectPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPreviewComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectPreviewComponent);
    component = fixture.componentInstance;
  });

  it('shows a billable badge when billable is true', () => {
    component.billable = true;
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.billable-badge');
    expect(badge).toBeTruthy();
  });

  it('hides the billable badge when billable is false', () => {
    component.billable = false;
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.billable-badge');
    expect(badge).toBeFalsy();
  });
});
