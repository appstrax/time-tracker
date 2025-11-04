import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSheetDateSelectorComponent } from './time-sheet-date-selector.component';

describe('TimeSheetDateSelectorComponent', () => {
  let component: TimeSheetDateSelectorComponent;
  let fixture: ComponentFixture<TimeSheetDateSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSheetDateSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeSheetDateSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
