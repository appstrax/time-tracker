import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSheetPage } from './time-sheet.page';

describe('TimeSheetPage', () => {
  let component: TimeSheetPage;
  let fixture: ComponentFixture<TimeSheetPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSheetPage]
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
