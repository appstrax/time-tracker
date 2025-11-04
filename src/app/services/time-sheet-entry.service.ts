import { Injectable } from '@angular/core';
import { CrudService, Operator } from '@appstrax/services/database';

import { TimeSheetEntry } from '../models/time-sheet-entry.model';

@Injectable({ providedIn: 'root' })
export class TimeSheetEntryService extends CrudService<TimeSheetEntry> {
  constructor() {
    super('time-sheet-entries', TimeSheetEntry);
  }

  public async getTimeSheetEntries(userId: string): Promise<TimeSheetEntry[]> {
    const timeSheetEntries = await this.find({ where: { userId } });
    return timeSheetEntries.data;
  }

  public async getTimeSheetEntriesByProjectId(projectId: string): Promise<TimeSheetEntry[]> {
    const timeSheetEntries = await this.find({ where: { projectId } });
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
}