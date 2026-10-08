import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricCardComponent } from './metric-card.component';

describe('MetricCardComponent', () => {
  let fixture: ComponentFixture<MetricCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricCardComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricCardComponent);
  });

  it('renders a subtitle when provided', () => {
    fixture.componentRef.setInput('subtitle', '3.5 h billable');
    fixture.detectChanges();
    const subtitle = fixture.nativeElement.querySelector('.metric-subtitle');
    expect(subtitle?.textContent?.trim()).toBe('3.5 h billable');
  });

  it('renders no subtitle element when not provided', () => {
    fixture.detectChanges();
    const subtitle = fixture.nativeElement.querySelector('.metric-subtitle');
    expect(subtitle).toBeFalsy();
  });
});
