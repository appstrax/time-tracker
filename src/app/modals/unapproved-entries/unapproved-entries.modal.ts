import { Component, Input, computed, input, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Store } from '@state';
import { TimeSheetEntry, User } from '@models';
import {
  buildProjectColorMap,
  getProjectColor,
  getUserDisplayName,
  TimeSheetDisplayUtil,
} from '@utils';

@Component({
  selector: 'app-unapproved-entries-modal',
  standalone: true,
  templateUrl: './unapproved-entries.modal.html',
  styleUrl: './unapproved-entries.modal.scss',
})
export class UnapprovedEntriesModalComponent {
  @Input() set entries(value: TimeSheetEntry[]) {
    this.dayEntries.set(value.map((entry) => entry.clone()));
  }
  @Input() date!: Date;
  @Input() userId?: string;
  @Input() headerEyebrow = 'Pending approvals';
  @Input() showEntryUsers = false;
  @Input() set users(value: User[]) {
    this.userDirectory.set(value ?? []);
  }
  @Input() canManageStatus = false;
  @Input() onEntryStatusChange?: (
    entry: TimeSheetEntry,
    approved: boolean,
  ) => Promise<TimeSheetEntry>;

  public readonly dayEntries = signal<TimeSheetEntry[]>([]);
  public readonly userDirectory = signal<User[]>([]);
  public readonly processingEntryIds = signal<Set<string>>(new Set());

  public projects = computed(() => this.store.projects.projects());
  public readonly projectColorById = computed(() =>
    buildProjectColorMap(this.projects()),
  );
  public readonly pendingCount = computed(
    () => this.dayEntries().filter((entry) => !entry.approved).length,
  );
  public readonly approvedCount = computed(
    () => this.dayEntries().filter((entry) => entry.approved).length,
  );
  public readonly headerSubtitle = computed(() => {
    if (this.userId) {
      return this.getUserName(this.userId);
    }
    const userIds = [...new Set(this.dayEntries().map((entry) => entry.userId))];
    if (userIds.length === 1) {
      return this.getUserName(userIds[0]);
    }
    return `${userIds.length} teammates`;
  });

  constructor(
    public activeModal: NgbActiveModal,
    private store: Store,
    private displayUtils: TimeSheetDisplayUtil,
  ) {}

  public getProjectName(projectId: string): string {
    return this.displayUtils.getProjectName(projectId, this.projects());
  }

  public getFieldLabel(entry: TimeSheetEntry, fieldKey: string): string {
    const project = this.projects().find((p) => p.id === entry.projectId);
    const field = project?.fields?.find((f) => f.key === fieldKey);
    return field?.label || fieldKey;
  }

  public getUserName(userId: string): string {
    const user =
      this.userDirectory().find((item) => item.id === userId) ?? null;
    return getUserDisplayName(user, userId);
  }

  public getEntryUserName(entry: TimeSheetEntry): string {
    return this.getUserName(entry.userId);
  }

  public projectColor(entry: TimeSheetEntry): string {
    return (
      this.projectColorById().get(entry.projectId) ??
      getProjectColor(entry.projectId, this.projects())
    );
  }

  public formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  public formatHours(hours: number): string {
    return this.displayUtils.formatHours(hours);
  }

  public getTotalHours(): string {
    const totalHours = this.dayEntries().reduce(
      (sum, entry) => sum + entry.hours,
      0,
    );
    return this.formatHours(totalHours);
  }

  public isProcessingEntry(entryId: string): boolean {
    return this.processingEntryIds().has(entryId);
  }

  public async setEntryStatus(
    entry: TimeSheetEntry,
    approved: boolean,
  ): Promise<void> {
    if (
      entry.approved === approved ||
      !this.canManageStatus ||
      !this.onEntryStatusChange ||
      this.isProcessingEntry(entry.id)
    ) {
      return;
    }

    this.processingEntryIds.update((ids) => new Set(ids).add(entry.id));

    try {
      const saved = await this.onEntryStatusChange(entry, approved);
      const updated = saved ?? entry;
      updated.approved = approved;

      this.dayEntries.update((entries) =>
        entries.map((item) =>
          item.id === updated.id ? updated.clone() : item,
        ),
      );
    } catch (error) {
      console.error('Error updating entry status:', error);
    } finally {
      this.processingEntryIds.update((ids) => {
        const next = new Set(ids);
        next.delete(entry.id);
        return next;
      });
    }
  }

  public close(): void {
    this.activeModal.close({ action: 'closed' });
  }
}

export interface UnapprovedEntriesModalOptions {
  entries: TimeSheetEntry[];
  date: Date;
  userId?: string;
  headerEyebrow?: string;
  showEntryUsers?: boolean;
  users?: User[];
  canManageStatus?: boolean;
  onEntryStatusChange?: (
    entry: TimeSheetEntry,
    approved: boolean,
  ) => Promise<TimeSheetEntry>;
}
