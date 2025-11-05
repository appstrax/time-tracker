import { DatePipe } from '@angular/common';
import { Component, Input, OnInit, Signal } from '@angular/core';
import { TimeSheetEntry } from 'src/app/models/time-sheet-entry.model';
import { TimeSheetNumberLineComponent } from '../time-sheet-number-line/time-sheet-number-line.component';
import { TimeSheetEntryCrudOptions } from '../../modals/time-sheet-entry-crud/time-sheet-entry-crud.component';
import { ModalService } from 'src/app/services/modal.service';
import { appstraxAuth, User } from '@appstrax/services/auth';
import { Store } from '@state';
import { Project } from '@models';
import { TimeSheetEntryService } from 'src/app/services/time-sheet-entry.service';

@Component({
  selector: 'app-time-sheet-day',
  standalone: true,
  templateUrl: './time-sheet-day.component.html',
  styleUrl: './time-sheet-day.component.scss',
  imports: [TimeSheetNumberLineComponent, DatePipe]
})
export class TimeSheetDayComponent implements OnInit {

  @Input() date: Date = new Date();
  @Input() entries: TimeSheetEntry[] = [];
  @Input() categoryColors: Map<string, string> = new Map<string, string>();

  @Input() projects: Project[] = [];

  user: User | null = null;

  constructor(
    private modalService: ModalService,
    private timeSheetEntryService: TimeSheetEntryService,
  ) { }

  async ngOnInit(): Promise<void> {

    const user = await appstraxAuth.getUser();
    if (!user) return;
    this.user = user;
  }


  async saveTimeSheetEntry(timeSheetEntry: TimeSheetEntry) {
    console.log(timeSheetEntry);
    await this.timeSheetEntryService.save(timeSheetEntry);
    console.log(timeSheetEntry);
  }


  openTimeSheetEntryCrudModal(timeSheetEntry?: TimeSheetEntry | undefined) {
    const options = new TimeSheetEntryCrudOptions();
    if (!timeSheetEntry) {
      timeSheetEntry = new TimeSheetEntry();
      timeSheetEntry.userId = this.user?.id ?? '';
      timeSheetEntry.date = this.date;
    }
    options.timeSheetEntry = timeSheetEntry;
    options.timeSheetEntry.date = this.date;
    options.onSave = (entry: TimeSheetEntry) => this.saveTimeSheetEntry(entry);
    this.modalService.showTimeSheetEntryCrudModal(options);
  }

  onEntryClick(entry: TimeSheetEntry) {
    console.log('Entry clicked:', entry);
    this.openTimeSheetEntryCrudModal(entry);
  }
}
