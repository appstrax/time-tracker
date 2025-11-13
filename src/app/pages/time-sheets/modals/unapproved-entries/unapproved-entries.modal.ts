import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TimeSheetEntry, Project } from '@models';
import { Store } from '@state';
import { appstraxAuth } from '@appstrax/services/auth';

@Component({
  selector: 'app-unapproved-entries-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unapproved-entries.modal.html',
  styleUrl: './unapproved-entries.modal.scss'
})
export class UnapprovedEntriesModalComponent implements OnInit {
  @Input() entries: TimeSheetEntry[] = [];
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
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) return `${wholeHours}h`;
    return `${wholeHours}h ${minutes}m`;
  }

  public getTotalHours(): number {
    return this.entries.reduce((sum, entry) => sum + entry.hours, 0);
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
  entries: TimeSheetEntry[];
  date: Date;
  userId: string;
  onApprove?: () => Promise<void>;
}

