import { Ignore } from '@appstrax/services/database';
import { Model } from '@appstrax/services/shared/models/model';

export class TimeSheetEntry extends Model {
    public userId: string = '';
    public projectId: string = '';
    public date: Date = new Date();
    public hours: number = 0;
    public description: string = '';
    public category: string = '';
}
