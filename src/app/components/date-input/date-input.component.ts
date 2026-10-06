import { Component, forwardRef, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {
  NgbDateParserFormatter,
  NgbDateStruct,
  NgbInputDatepicker,
} from '@ng-bootstrap/ng-bootstrap';

import { AppDateFormatter, validDate } from './date-formatter';

/**
 * Themed date field bound to a `yyyy-MM-dd` string. Replaces the native
 * `<input type="date">`, whose popup can't be dismissed on macOS browsers.
 */
@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [FormsModule, NgbInputDatepicker],
  templateUrl: './date-input.component.html',
  styleUrl: './date-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
    { provide: NgbDateParserFormatter, useClass: AppDateFormatter },
  ],
})
export class DateInputComponent implements ControlValueAccessor {
  public readonly inputId = input<string>('');
  public readonly placeholder = input('Select date');
  public readonly required = input(false);
  /** Shows a clear button; only for fields where an empty value is meaningful. */
  public readonly clearable = input(false);
  public readonly ariaLabel = input<string | null>(null);
  /** `field` looks like a Bootstrap form-control; `bare` blends into a pill. */
  public readonly variant = input<'field' | 'bare'>('field');

  public readonly model = signal<NgbDateStruct | null>(null);
  public readonly disabled = signal(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  public writeValue(value: string | null): void {
    this.model.set(DateInputComponent.parse(value));
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  public onDateSelect(date: NgbDateStruct): void {
    this.model.set(date);
    this.onChange(DateInputComponent.serialize(date));
    this.onTouched();
  }

  public clear(): void {
    this.model.set(null);
    this.onChange('');
    this.onTouched();
  }

  public markTouched(): void {
    this.onTouched();
  }

  private static parse(value: string | null): NgbDateStruct | null {
    if (!value) return null;
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return validDate(year, month, day);
  }

  private static serialize(date: NgbDateStruct): string {
    const mm = String(date.month).padStart(2, '0');
    const dd = String(date.day).padStart(2, '0');
    return `${date.year}-${mm}-${dd}`;
  }
}
