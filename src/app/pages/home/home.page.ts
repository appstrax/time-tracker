import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Project } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { Store } from '@state';
import { TimeSheetDisplayUtil } from '@utils';

interface ProjectHoursBar {
  projectId: string;
  projectName: string;
  hours: number;
  percent: number;
}

@Component({
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class HomePage {
  public readonly isLoading = signal(true);
  public readonly hasLoaded = signal(false);
  public readonly graphData = signal<ProjectHoursBar[]>([]);
  public readonly totalHours = computed(() =>
    this.graphData().reduce((sum, item) => sum + item.hours, 0),
  );
  public readonly activeProjects = computed(
    () => this.graphData().filter((item) => item.hours > 0).length,
  );
  public readonly hasProjects = computed(() => this.graphData().length > 0);
  public readonly hasCapturedHours = computed(() => this.totalHours() > 0);
  public readonly rangeStart = this.createRangeStart();
  public readonly rangeEnd = this.createRangeEnd();
  public readonly rangeLabel = this.formatRangeLabel(
    this.rangeStart,
    this.rangeEnd,
  );
  private latestLoadId = 0;

  constructor(
    private store: Store,
    private timeSheetEntryService: TimeSheetEntryService,
    private timeSheetDisplayUtil: TimeSheetDisplayUtil,
    private toast: ToastService,
  ) {
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
        this.graphData.set([]);
        return;
      }

      void this.loadGraphData(user.id, projects);
    });
  }

  public formatHours(hours: number): string {
    return this.timeSheetDisplayUtil.formatHours(hours);
  }

  private async loadGraphData(
    userId: string,
    projects: Project[],
  ): Promise<void> {
    const loadId = ++this.latestLoadId;
    this.isLoading.set(true);

    try {
      const entries =
        await this.timeSheetEntryService.findByUserAndDateRange(
          userId,
          this.rangeStart,
          this.rangeEnd,
        );

      const hoursByProject = new Map<string, number>();
      for (const entry of entries) {
        hoursByProject.set(
          entry.projectId,
          (hoursByProject.get(entry.projectId) ?? 0) + entry.hours,
        );
      }

      const visibleProjects = [...projects].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      const maxHours = Math.max(
        ...visibleProjects.map((project) => hoursByProject.get(project.id) ?? 0),
        0,
      );

      const graphData = visibleProjects
        .map((project) => {
          const hours = hoursByProject.get(project.id) ?? 0;
          return {
            projectId: project.id,
            projectName: project.name || 'Untitled project',
            hours,
            percent: maxHours > 0 ? (hours / maxHours) * 100 : 0,
          };
        })
        .sort(
          (a, b) => b.hours - a.hours || a.projectName.localeCompare(b.projectName),
        );

      if (loadId !== this.latestLoadId) return;

      this.graphData.set(graphData);
    } catch {
      if (loadId !== this.latestLoadId) return;

      this.graphData.set([]);
      this.toast.error('Unable to load last week captured hours.');
    } finally {
      if (loadId !== this.latestLoadId) return;

      this.isLoading.set(false);
      this.hasLoaded.set(true);
    }
  }

  private createRangeStart(): Date {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private createRangeEnd(): Date {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private formatRangeLabel(start: Date, end: Date): string {
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    });

    return `${dateFormatter.format(start)} to ${dateFormatter.format(end)}`;
  }
}
