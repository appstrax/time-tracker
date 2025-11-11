import { Model } from '@appstrax/services/shared/models/model';

export class TimeSheetEntry extends Model {
  public userId: string = '';
  public projectId: string = '';
  public date: Date = new Date();
  public hours: number = 0;
  public description: string = '';
  public category: string = '';

  clone(): TimeSheetEntry {
    const entry = new TimeSheetEntry();
    Object.assign(entry, this);
    return entry;
  }
}
