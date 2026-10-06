import { Injectable } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Displays dates as `6 Oct 2026`; fields are read-only so parsing is a fallback. */
@Injectable()
export class AppDateFormatter extends NgbDateParserFormatter {
  public parse(value: string): NgbDateStruct | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value?.trim() ?? '');
    if (!match) return null;
    return { year: +match[1], month: +match[2], day: +match[3] };
  }

  public format(date: NgbDateStruct | null): string {
    if (!date) return '';
    return `${date.day} ${MONTHS[date.month - 1]} ${date.year}`;
  }
}
