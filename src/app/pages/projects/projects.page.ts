import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { Project } from '@models';
import { ToastService } from '@services';
import { Store } from '@state';
import { ProjectPreviewComponent } from '@components';
import { buildProjectColorMap, getProjectColor } from '@utils';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.page.html',
  styleUrls: ['./projects.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, ProjectPreviewComponent],
})
export class ProjectsPage implements OnInit {
  private readonly store = inject(Store);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  public readonly loading = this.store.projects.loading;
  public readonly loaded = computed(() => !!this.store.projects.fetchedAt());
  public readonly projects = this.store.projects.projects;
  public readonly projectColorById = computed(() =>
    buildProjectColorMap(this.projects()),
  );

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

  public projectColor(project: Project): string {
    return (
      this.projectColorById().get(project.id) ??
      getProjectColor(project.id, this.projects())
    );
  }

  public goToProject(project: Project): void {
    void this.router.navigate(['/projects/project'], {
      queryParams: { id: project.id },
    });
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
