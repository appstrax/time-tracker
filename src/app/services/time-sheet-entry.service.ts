import { Injectable } from '@angular/core';
import {
  CrudService,
  FetchQuery,
  Operator,
  OrderDirection,
} from '@appstrax/services/database';

import { TimeSheetEntry } from '../models/time-sheet-entry.model';

/** API default/max page size when `limit` is omitted (see DatabaseService). */
const ENTRY_FETCH_PAGE_SIZE = 1000;

@Injectable({ providedIn: 'root' })
export class TimeSheetEntryService extends CrudService<TimeSheetEntry> {
  constructor() {
    super('time-sheet-entries', TimeSheetEntry);
  }

  public async findByUserId(userId: string): Promise<TimeSheetEntry[]> {
    return this.findAllPages({
      where: { userId },
      order: { createdAt: OrderDirection.ASC },
    });
  }

  public async findByProjectId(
    projectIds: string[],
  ): Promise<TimeSheetEntry[]> {
    return this.findAllPages({
      where: { projectId: { [Operator.IN]: projectIds } },
      order: { createdAt: OrderDirection.ASC },
    });
  }

  /**
   * Fetches every row matching `query`. A single `find()` without `limit` only
   * returns the first API page (default 1000, ordered as requested), which
   * silently drops newer rows when ordered by `createdAt` ASC.
   */
  private async findAllPages(
    query: Omit<FetchQuery, 'limit' | 'offset'>,
  ): Promise<TimeSheetEntry[]> {
    const entries: TimeSheetEntry[] = [];
    let offset = 0;
    let totalCount = Number.POSITIVE_INFINITY;

    while (entries.length < totalCount) {
      const res = await this.find({
        ...query,
        limit: ENTRY_FETCH_PAGE_SIZE,
        offset,
      });
      totalCount = res.count;
      if (!res.data.length) {
        break;
      }
      entries.push(...res.data);
      offset += res.data.length;
    }

    return entries;
  }

  public async findByUserAndDateRange(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<TimeSheetEntry[]> {
    const res = await this.find({
      where: {
        [Operator.AND]: [
          { userId: userId },
          { date: { [Operator.GTE]: start } },
          { date: { [Operator.LTE]: end } },
        ],
      },
    });
    return res.data;
  }

  public async findByUserAndDate(
    userId: string,
    date: Date,
  ): Promise<TimeSheetEntry[]> {
    // Get start and end of the day
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const timeSheetEntries = await this.find({
      where: {
        [Operator.AND]: [
          { userId: userId },
          { date: { [Operator.GTE]: start } },
          { date: { [Operator.LTE]: end } },
        ],
      },
      order: { createdAt: OrderDirection.ASC },
    });
    return timeSheetEntries.data;
  }
}
