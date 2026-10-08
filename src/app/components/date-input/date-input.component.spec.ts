import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppDateFormatter } from './date-formatter';
import { DateInputComponent } from './date-input.component';

describe('DateInputComponent', () => {
  let fixture: ComponentFixture<DateInputComponent>;
  let component: DateInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateInputComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should read and write yyyy-MM-dd strings', () => {
    const onChange = jasmine.createSpy('onChange');
    component.registerOnChange(onChange);

    component.writeValue('2026-10-06');
    expect(component.model()).toEqual({ year: 2026, month: 10, day: 6 });

    component.onDateSelect({ year: 2027, month: 1, day: 5 });
    expect(onChange).toHaveBeenCalledWith('2027-01-05');
  });

  it('should ignore invalid incoming values', () => {
    component.writeValue('2026-13-45');
    expect(component.model()).toBeNull();
    component.writeValue('2026-02-30');
    expect(component.model()).toBeNull();
  });

  it('should emit an empty string when cleared', () => {
    const onChange = jasmine.createSpy('onChange');
    component.registerOnChange(onChange);
    component.writeValue('2026-10-06');

    component.clear();

    expect(component.model()).toBeNull();
    expect(onChange).toHaveBeenCalledWith('');
  });
});

describe('AppDateFormatter', () => {
  const formatter = new AppDateFormatter();

  it('should round-trip its own display format', () => {
    const text = formatter.format({ year: 2026, month: 10, day: 6 });
    expect(text).toBe('6 Oct 2026');
    expect(formatter.parse(text)).toEqual({ year: 2026, month: 10, day: 6 });
  });

  it('should reject impossible dates', () => {
    expect(formatter.parse('2026-02-30')).toBeNull();
    expect(formatter.parse('31 Feb 2026')).toBeNull();
  });
});
