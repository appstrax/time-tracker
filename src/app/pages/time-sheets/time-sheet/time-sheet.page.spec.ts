import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TimeSheetPage } from './time-sheet.page';

describe('TimeSheetPage', () => {
  let component: TimeSheetPage;
  let fixture: ComponentFixture<TimeSheetPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSheetPage],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeSheetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
