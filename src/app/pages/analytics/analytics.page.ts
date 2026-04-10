import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject, signal } from '@angular/core';

import { TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, ToastService, UsersService } from '@services';
import { Store } from '@state';

import {
  FilterViewContainerComponent,
  SummaryMetricsComponent,
} from './components';

@Component({
  standalone: true,
  imports: [FormsModule, FilterViewContainerComponent, SummaryMetricsComponent],
  templateUrl: './analytics.page.html',
  styleUrl: './analytics.page.scss',
})
export class AnalyticsPage implements OnInit {
  private readonly store = inject(Store);
  private readonly entryService = inject(TimeSheetEntryService);
  private readonly toast = inject(ToastService);
  private readonly usersService = inject(UsersService);

  public readonly loading = signal(false);

  public readonly projects = this.store.projects.projects;
  public readonly entries = signal<TimeSheetEntry[]>([]);
  public readonly users = signal<User[]>([]);

  public ngOnInit(): void {
    this.fetchTimeSheetEntries();
    this.fetchUsers();
  }

  private async fetchTimeSheetEntries(): Promise<void> {
    this.loading.set(true);

    await this.waitForProjects();
    if (!this.projects().length) {
      this.loading.set(false);
      return;
    }

    try {
      const projectIds = this.projects().map((project) => project.id);

      if (projectIds.length) {
        const entries = await this.entryService.findByProjectId(projectIds);
        this.entries.set(entries);
      }
    } catch (error) {
      this.toast.error('Failed to fetch time sheet entries');
      this.entries.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async waitForProjects(): Promise<void> {
    if (this.store.projects.fetchedAt()) return;
    while (true) {
      if (this.store.projects.fetchedAt()) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private async fetchUsers(): Promise<void> {
    try {
      const users = await this.usersService.fetchUsers();
      this.users.set(users);
    } catch (error) {
      this.toast.error('Failed to fetch users');
      this.users.set([]);
    }
  }

  public onEntryUpdated(entry: TimeSheetEntry): void {
    this.entries.update((entries) =>
      entries.map((e) => (e.id === entry.id ? entry : e)),
    );
  }
}
