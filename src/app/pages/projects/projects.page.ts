import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Project } from '@models';
import { ToastService } from '@services';
import { Store } from '@state';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.page.html',
  styleUrls: ['./projects.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class ProjectsPage implements OnInit {
  private readonly store = inject(Store);
  private readonly toast = inject(ToastService);

  public readonly loading = this.store.projects.loading;
  public readonly loaded = computed(() => !!this.store.projects.fetchedAt());
  public readonly projects = this.store.projects.projects;

  ngOnInit(): void {
    this.fetchProjects();
  }

  private async fetchProjects(): Promise<void> {
    const user = this.store.user.user();
    if (!user) return;

    try {
      await this.store.projects.fetchUserProjects(user);
    } catch {
      this.toast.error('Unable to load projects.');
    }
  }

  public formatUpdatedAt(project: Project): string {
    const date = project.updatedAt ?? project.createdAt;
    if (!(date instanceof Date) || Number.isNaN(date.getTime()))
      return 'Recently';

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }
}
