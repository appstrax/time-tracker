import {
  dateFromLocalCalendarDayKey,
  isFutureLocalCalendarDay,
  isFutureUtcCalendarDay,
  localCalendarDayKey,
  startOfLocalCalendarDay,
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

  describe('local calendar day helpers', () => {
    const localReference = new Date(2026, 3, 8, 15, 30, 0, 0);

    it('startOfLocalCalendarDay normalizes to local midnight', () => {
      const start = startOfLocalCalendarDay(localReference);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(3);
      expect(start.getDate()).toBe(8);
    });

    it('isFutureLocalCalendarDay is false for today and past local days', () => {
      expect(
        isFutureLocalCalendarDay(localReference, localReference),
      ).toBe(false);
      expect(
        isFutureLocalCalendarDay(new Date(2026, 3, 7, 23, 59, 59, 999), localReference),
      ).toBe(false);
    });

    it('isFutureLocalCalendarDay is true from the next local day onwards', () => {
      expect(
        isFutureLocalCalendarDay(new Date(2026, 3, 9, 0, 0, 0, 0), localReference),
      ).toBe(true);
      expect(
        isFutureLocalCalendarDay(new Date(2026, 4, 1, 0, 0, 0, 0), localReference),
      ).toBe(true);
    });

    it('localCalendarDayKey and dateFromLocalCalendarDayKey round-trip local days', () => {
      const key = localCalendarDayKey(localReference);
      expect(key).toBe('2026-04-08');
      const day = dateFromLocalCalendarDayKey(key);
      expect(day.getTime()).toBe(startOfLocalCalendarDay(localReference).getTime());
    });
  });
});
