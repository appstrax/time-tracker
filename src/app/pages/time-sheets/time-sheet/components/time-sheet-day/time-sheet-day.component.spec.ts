import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSheetDayComponent } from './time-sheet-day.component';

describe('TimeSheetDayComponent', () => {
  let component: TimeSheetDayComponent;
  let fixture: ComponentFixture<TimeSheetDayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSheetDayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeSheetDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
