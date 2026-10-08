import { Injectable } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

@Injectable()
export class AppDateFormatter extends NgbDateParserFormatter {
  public parse(value: string): NgbDateStruct | null {
    const text = value?.trim() ?? '';
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (iso) return validDate(+iso[1], +iso[2], +iso[3]);
    const display = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/.exec(text);
    if (display) {
      const month = MONTHS.findIndex(
        (m) => m.toLowerCase() === display[2].toLowerCase(),
      );
      return validDate(+display[3], month + 1, +display[1]);
    }
    return null;
  }

  public format(date: NgbDateStruct | null): string {
    if (!date) return '';
    return `${date.day} ${MONTHS[date.month - 1]} ${date.year}`;
  }
}

export function validDate(
  year: number,
  month: number,
  day: number,
): NgbDateStruct | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return valid ? { year, month, day } : null;
}
