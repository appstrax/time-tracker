import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSheetEntryComponent } from './time-sheet-entry.modal';

describe('TimeSheetEntryComponent', () => {
  let component: TimeSheetEntryComponent;
  let fixture: ComponentFixture<TimeSheetEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSheetEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeSheetEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
