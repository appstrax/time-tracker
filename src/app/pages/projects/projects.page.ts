import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Project } from '@models';
import { ProjectService, ToastService } from '@services';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.page.html',
  styleUrls: ['./projects.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class ProjectsPage {
  public readonly isLoading = signal(true);
  public readonly projects = signal<Project[]>([]);
  public readonly hasLoaded = signal(false);

  constructor(
    private projectService: ProjectService,
    private toast: ToastService,
  ) {
    void this.loadProjects();
  }

  public formatUpdatedAt(project: Project): string {
    const date = project.updatedAt ?? project.createdAt;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'Recently';

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  private async loadProjects(): Promise<void> {
    this.isLoading.set(true);

    try {
      const projects = await this.projectService.findAll();
      this.projects.set(
        [...projects].sort(
          (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
        ),
      );
    } catch {
      this.projects.set([]);
      this.toast.error('Unable to load projects.');
    } finally {
      this.isLoading.set(false);
      this.hasLoaded.set(true);
    }
  }
}
