import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeSheetEntry, Project, User } from '@models';
import { Store } from '@state';
import { TimeCalculationUtils } from 'src/app/utils/time-calculation-utils';

@Component({
  selector: 'app-filter-view-by-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-view-by-user.component.html',
  styleUrl: './filter-view-by-user.component.scss'
})
export class FilterViewByUserComponent implements OnInit {
  @Input() entries: TimeSheetEntry[] = [];
  @Input() projects: Project[] = [];

  private store = inject(Store);

  ngOnInit(): void {
    if (this.projects.length === 0) {
      this.projects = this.store.projects.all();
    }
    // Load users from store if available
    // For now, we'll extract unique user IDs from entries
  }

  public getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  }

  public formatHours(hours: number): string {
    return TimeCalculationUtils.formatHours(hours);
  }

  public getEntriesByUser(): {
    userId: string;
    totalHours: number;
    approvedHours: number;
    pendingHours: number;
    entryCount: number;
    entries: TimeSheetEntry[]
  }[] {
    const userMap = new Map<string, {
      totalHours: number;
      approvedHours: number;
      pendingHours: number;
      entryCount: number;
      entries: TimeSheetEntry[]
    }>();

    this.entries.forEach(entry => {
      if (!userMap.has(entry.userId)) {
        userMap.set(entry.userId, {
          totalHours: 0,
          approvedHours: 0,
          pendingHours: 0,
          entryCount: 0,
          entries: []
        });
      }

      const userData = userMap.get(entry.userId)!;
      userData.totalHours += entry.hours;
      userData.entryCount += 1;
      userData.entries.push(entry);

      if (entry.approved) {
        userData.approvedHours += entry.hours;
      } else {
        userData.pendingHours += entry.hours;
      }
    });

    return Array.from(userMap.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }

  public getUserDisplayName(userId: string): string {
    // Try to get user from store if available
    // For now, return a shortened ID
    return userId.substring(0, 8) + '...';
  }

  public getEntriesForUser(userId: string): TimeSheetEntry[] {
    return this.entries.filter(entry => entry.userId === userId);
  }
}

