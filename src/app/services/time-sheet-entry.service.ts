import { Injectable } from '@angular/core';
import { CrudService, Operator, OrderDirection } from '@appstrax/services/database';

import { TimeSheetEntry } from '../models/time-sheet-entry.model';

@Injectable({ providedIn: 'root' })
export class TimeSheetEntryService extends CrudService<TimeSheetEntry> {
  constructor() {
    super('time-sheet-entries', TimeSheetEntry);
  }

  public async getTimeSheetEntriesByUserId(userId: string): Promise<TimeSheetEntry[]> {
    const timeSheetEntries = await this.find({ where: { userId }, order: { 'createdAt': OrderDirection.ASC} });
    return timeSheetEntries.data;
  }

  public async getTimeSheetEntriesByProjectId(projectIds: string[]): Promise<TimeSheetEntry[]> {
    const timeSheetEntries = await this.find({ where: {  projectId: { [Operator.IN]: projectIds } }, order: { 'createdAt': OrderDirection.ASC} });
    return timeSheetEntries.data;
  }

  public async getByFilter(filters: any): Promise<TimeSheetEntry[]> {
    const timeSheetEntries = await this.find({ where: filters, order: { 'createdAt': OrderDirection.ASC} });
    return timeSheetEntries.data;
  }



  public async getTimeSheetEntriesByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSheetEntry[]> {
    const timeSheetEntries = await this.find({
      where: {
        [Operator.AND]: [
          { 'userId': userId },
          { 'date': {[Operator.GTE]: startDate} },
          { 'date': {[Operator.LTE]: endDate} },
        ],
      },
    });
    return timeSheetEntries.data;
  }

  public async getTimeSheetEntriesByUserIdAndDate(
    userId: string,
    date: Date,
  ): Promise<TimeSheetEntry[]> {
    // Get start and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const timeSheetEntries = await this.find({
      where: {
        [Operator.AND]: [
          { 'userId': userId },
          { 'date': { [Operator.GTE]: startOfDay } },
          { 'date': { [Operator.LTE]: endOfDay } },
        ],
      },
      order: { 'createdAt': OrderDirection.ASC }
    });
    return timeSheetEntries.data;
  }
}
