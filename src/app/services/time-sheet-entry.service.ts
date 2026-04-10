import { Injectable } from '@angular/core';
import {
  CrudService,
  Operator,
  OrderDirection,
} from '@appstrax/services/database';

import { TimeSheetEntry } from '../models/time-sheet-entry.model';

@Injectable({ providedIn: 'root' })
export class TimeSheetEntryService extends CrudService<TimeSheetEntry> {
  constructor() {
    super('time-sheet-entries', TimeSheetEntry);
  }

  public async findByUserId(userId: string): Promise<TimeSheetEntry[]> {
    const res = await this.find({
      where: { userId },
      order: { createdAt: OrderDirection.ASC },
    });
    return res.data;
  }

  public async findByProjectId(
    projectIds: string[],
  ): Promise<TimeSheetEntry[]> {
    const res = await this.find({
      where: { projectId: { [Operator.IN]: projectIds } },
      order: { createdAt: OrderDirection.ASC },
    });
    return res.data;
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
