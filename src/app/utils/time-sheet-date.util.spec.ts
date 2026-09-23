import {
  isFutureUtcCalendarDay,
  startOfUtcCalendarDay,
} from './time-sheet-date.util';

describe('time-sheet-date.util', () => {
  const reference = new Date('2026-04-08T15:30:00.000Z');

  it('startOfUtcCalendarDay normalizes to UTC midnight', () => {
    const start = startOfUtcCalendarDay(reference);
    expect(start.toISOString()).toBe('2026-04-08T00:00:00.000Z');
  });

  it('isFutureUtcCalendarDay is false for today and past days', () => {
    expect(isFutureUtcCalendarDay(reference, reference)).toBe(false);
    expect(
      isFutureUtcCalendarDay(new Date('2026-04-07T23:59:59.999Z'), reference),
    ).toBe(false);
  });

  it('isFutureUtcCalendarDay is true from tomorrow onwards', () => {
    expect(
      isFutureUtcCalendarDay(new Date('2026-04-09T00:00:00.000Z'), reference),
    ).toBe(true);
    expect(
      isFutureUtcCalendarDay(new Date('2026-05-01T00:00:00.000Z'), reference),
    ).toBe(true);
  });
});
