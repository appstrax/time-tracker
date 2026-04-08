import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeSheetEntryItemComponent } from './time-sheet-entry-item.component';


describe('TimeSheetEntryItemComponent', () => {
  let component: TimeSheetEntryItemComponent;
  let fixture: ComponentFixture<TimeSheetEntryItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSheetEntryItemComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeSheetEntryItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('entry', {
      hours: 1.5,
      category: 'Development',
      description: 'Spec entry',
    } as any);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
