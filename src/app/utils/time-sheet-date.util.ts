export const FUTURE_TIMESHEET_ENTRY_TOAST = 'Cannot add a timesheet entry in the future.';

/** Midnight UTC for the calendar day of `date` (matches weekly timesheet navigation). */
export function startOfUtcCalendarDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

/** Midnight local time for the calendar day of `date` (matches Angular DatePipe / `toDateString`). */
export function startOfLocalCalendarDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** True when `date` is strictly after `reference`'s UTC calendar day (e.g. tomorrow). */
export function isFutureUtcCalendarDay(
  date: Date,
  reference: Date = new Date(),
): boolean {
  return (
    startOfUtcCalendarDay(date).getTime() >
    startOfUtcCalendarDay(reference).getTime()
  );
}

/** True when `date` is strictly after `reference`'s local calendar day (e.g. tomorrow). */
export function isFutureLocalCalendarDay(
  date: Date,
  reference: Date = new Date(),
): boolean {
  return (
    startOfLocalCalendarDay(date).getTime() >
    startOfLocalCalendarDay(reference).getTime()
  );
}
