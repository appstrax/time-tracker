import { Model } from '@appstrax/services/shared/models/model';

import { TimeSheetFieldValue } from './time-sheet-field.model';

export class TimeSheetEntry extends Model {
  public userId: string = '';
  public projectId: string = '';
  public date: Date = new Date();
  public hours: number = 0;
  public description: string = '';
  public category: string = '';
  public approved: boolean = false;
  public fieldValues: TimeSheetFieldValue[] = [];

  clone(): TimeSheetEntry {
    const entry = new TimeSheetEntry();
    Object.assign(entry, this);
    entry.fieldValues = this.fieldValues.map((fv) => ({ ...fv }));
    return entry;
  }
}
