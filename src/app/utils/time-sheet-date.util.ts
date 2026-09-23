export const FUTURE_TIMESHEET_ENTRY_TOAST =
  'Cannot add a timesheet entry in the future.';

/** Weekly navigator and day columns use UTC calendar days. */
export const TIMESHEET_CALENDAR_TIMEZONE = 'UTC';

/** Midnight UTC for the calendar day of `date` (matches weekly timesheet navigation). */
export function startOfUtcCalendarDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

/** Stable key for grouping entries by UTC calendar day. */
export function toUtcCalendarDateKey(date: Date): string {
  const normalized = startOfUtcCalendarDay(date);
  const year = normalized.getUTCFullYear();
  const month = String(normalized.getUTCMonth() + 1).padStart(2, '0');
  const day = String(normalized.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
