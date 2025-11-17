import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { appstraxAuth } from '@appstrax/services/auth';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@state';
import { TimeSheetEntry, Project } from '@models';
import { TimeCalculationUtils } from 'src/app/utils/time-calculation-utils';

@Component({
  selector: 'app-unapproved-entries-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unapproved-entries.modal.html',
  styleUrl: './unapproved-entries.modal.scss'
})
export class UnapprovedEntriesModalComponent implements OnInit {
  @Input() entries: TimeSheetEntry[] = []; // All entries for the user on this day
  @Input() unapprovedEntries: TimeSheetEntry[] = []; // Only unapproved entries (for approve button)
  @Input() date!: Date;
  @Input() userId!: string;
  @Input() onApprove?: () => Promise<void>;

  public projects: Project[] = [];
  public currentUserId: string = '';
  public isApproving: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private store: Store
  ) {}

  async ngOnInit(): Promise<void> {
    const user = await appstraxAuth.getUser();
    if (user) {
      this.currentUserId = user.id;
    }
    this.projects = this.store.projects.all();
  }

  public getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  }

  public getUserName(userId: string): string {
    if (userId === this.currentUserId) {
      return 'You';
    }
    return userId.substring(0, 8);
  }

  public formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  public formatHours(hours: number): string {
    return TimeCalculationUtils.formatHours(hours);
  }

  public getTotalHours(): string {
    let totalHours = this.entries.reduce((sum, entry) => sum + entry.hours, 0);
    return this.formatHours(totalHours);
  }

  public isEntryUnapproved(entry: TimeSheetEntry): boolean {
    return !entry.approved;
  }

  public getUnapprovedCount(): number {
    return this.unapprovedEntries?.length || 0;
  }

  public getUniqueCategories(): string[] {
    const categories = this.entries
      .map(entry => entry.category)
      .filter(category => category && category.trim() !== '');
    return [...new Set(categories)].sort();
  }

  public async approveAll(): Promise<void> {
    if (!this.onApprove) return;

    try {
      this.isApproving = true;
      await this.onApprove();
      this.activeModal.close({ action: 'approved' });
    } catch (error) {
      console.error('Error approving entries:', error);
    } finally {
      this.isApproving = false;
    }
  }

  public close(): void {
    this.activeModal.dismiss();
  }
}

export interface UnapprovedEntriesModalOptions {
  entries: TimeSheetEntry[]; // All entries for the user on this day
  unapprovedEntries?: TimeSheetEntry[]; // Only unapproved entries (for approve button)
  date: Date;
  userId: string;
  onApprove?: () => Promise<void>;
}

