import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSheetEntryCrudComponent } from './time-sheet-entry-crud.component';

describe('TimeSheetEntryCrudComponent', () => {
  let component: TimeSheetEntryCrudComponent;
  let fixture: ComponentFixture<TimeSheetEntryCrudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSheetEntryCrudComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeSheetEntryCrudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
