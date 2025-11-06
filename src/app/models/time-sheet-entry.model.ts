import { Ignore } from '@appstrax/services/database';
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
        entry.userId = this.userId;
        entry.projectId = this.projectId;
        entry.date = this.date;
        entry.hours = this.hours;
        entry.description = this.description;
        entry.category = this.category;
        return entry;
    }

    update(entry: TimeSheetEntry): void {
        this.userId = entry.userId;
        this.projectId = entry.projectId;
        this.date = entry.date;
        this.hours = entry.hours;
        this.description = entry.description;
        this.category = entry.category;
    }
}
