import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeSheetEntryItemComponent } from './time-sheet-entry-item.component';


describe('TimeSheetEntryItemComponent', () => {
  let component: TimeSheetEntryItemComponent;
  let fixture: ComponentFixture<TimeSheetEntryItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSheetEntryItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeSheetEntryItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
