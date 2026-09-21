import { Component, computed, effect, inject, signal } from '@angular/core';

import { FilterView, FilterViewContainerComponent } from '@components';
import { TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { Store } from '@state';

@Component({
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [FilterViewContainerComponent],
})
export class HomePage {
  private readonly store = inject(Store);
  private readonly timeSheetEntryService = inject(TimeSheetEntryService);
  private readonly toast = inject(ToastService);

  public readonly isLoading = signal(true);
  public readonly hasLoaded = signal(false);
  public readonly entries = signal<TimeSheetEntry[]>([]);
  public readonly projects = computed(() => this.store.projects.projects());
  public readonly hasProjects = computed(() => this.projects().length > 0);

  public readonly noUsers: User[] = [];
  public readonly homeAvailableViews: FilterView[] = [
    'summary',
    'details',
    'timeline',
  ];

  private latestLoadId = 0;

  constructor() {
    effect(() => {
      const user = this.store.user.user();
      const userLoading = this.store.user.loading();
      const projects = this.store.projects.projects();
      const projectsLoading = this.store.projects.loading();

      if (userLoading || (projectsLoading && user?.id && !projects.length)) {
        this.isLoading.set(true);
        return;
      }

      if (!user?.id) {
        this.isLoading.set(false);
        this.hasLoaded.set(true);
        this.entries.set([]);
        return;
      }

      void this.loadEntries(user.id);
    });
  }

  private async loadEntries(userId: string): Promise<void> {
    const loadId = ++this.latestLoadId;
    this.isLoading.set(true);

    try {
      const entries = await this.timeSheetEntryService.findByUserId(userId);
      if (loadId !== this.latestLoadId) return;
      this.entries.set(entries);
    } catch {
      if (loadId !== this.latestLoadId) return;
      this.entries.set([]);
      this.toast.error('Unable to load your time entries.');
    } finally {
      if (loadId !== this.latestLoadId) return;
      this.isLoading.set(false);
      this.hasLoaded.set(true);
    }
  }
}
