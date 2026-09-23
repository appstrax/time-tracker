import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  ALL_DATE_RANGE_MAX_YEARS,
  TimeSheetFilterUtil,
} from './time-sheet-filter.util';

describe('TimeSheetFilterUtil', () => {
  let util: TimeSheetFilterUtil;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), TimeSheetFilterUtil],
    });
    util = TestBed.inject(TimeSheetFilterUtil);
  });

  it('allPresetFetchStart caps history at ALL_DATE_RANGE_MAX_YEARS', () => {
    const end = new Date(2026, 5, 15, 23, 59, 59, 999);
    const start = util.allPresetFetchStart(end);

    expect(start.getFullYear()).toBe(2026 - ALL_DATE_RANGE_MAX_YEARS);
    expect(start.getMonth()).toBe(5);
    expect(start.getDate()).toBe(15);
    expect(start.getHours()).toBe(0);
  });

  it('calculateDateRangeBounds all still uses epoch for client filter bounds', () => {
    const bounds = util.calculateDateRangeBounds('all');

    expect(bounds.start.getTime()).toBe(0);
    const expectedEnd = new Date();
    expectedEnd.setHours(23, 59, 59, 999);
    expect(bounds.end.getTime()).toBe(expectedEnd.getTime());
  });
});
