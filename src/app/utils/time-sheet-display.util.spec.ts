import { TimeSheetDisplayUtil } from './time-sheet-display.util';

describe('TimeSheetDisplayUtil', () => {
  const util = new TimeSheetDisplayUtil();

  describe('formatQuarterHourDuration', () => {
    it('formats 0.25 hours as 15m', () => {
      expect(util.formatQuarterHourDuration(0.25)).toBe('15m');
    });

    it('formats quarter-hour steps consistently', () => {
      expect(util.formatQuarterHourDuration(0)).toBe('');
      expect(util.formatQuarterHourDuration(0.5)).toBe('30m');
      expect(util.formatQuarterHourDuration(0.75)).toBe('45m');
      expect(util.formatQuarterHourDuration(1.25)).toBe('1h 15m');
    });

    it('coerces string hour values from range inputs', () => {
      expect(util.formatQuarterHourDuration('0.25' as unknown as number)).toBe(
        '15m',
      );
    });
  });

  describe('formatHours', () => {
    it('formats 0.25 hours as 0h 15m', () => {
      expect(util.formatHours(0.25)).toBe('0h 15m');
    });
  });
});
