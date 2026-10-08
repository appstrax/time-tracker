import { DateInputComponent } from '../../../../components/date-input/date-input.component';
import { ProjectDropdownComponent } from '../../../../components/project-dropdown/project-dropdown.component';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { AnalyticsFilter, DateRange, Project, Status, User } from '@models';
import { TimeSheetFilterUtil, getUserDisplayName } from '@utils';

import { formatDateInput } from '../../analytics-filter.util';

/** Pill filters (status, range, team member, category) synced to the URL query. */
@Component({
  selector: 'app-analytics-filters',
  standalone: true,
  imports: [FormsModule, DateInputComponent, ProjectDropdownComponent],
  templateUrl: './analytics-filters.component.html',
  styleUrl: './analytics-filters.component.scss',
})
export class AnalyticsFiltersComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly filterUtils = inject(TimeSheetFilterUtil);
  private subscription?: Subscription;

  public readonly users = input<User[]>([]);
  public readonly showUser = input(true);
  public readonly showProject = input(false);
  public readonly projects = input<Project[]>([]);
  /** Team member ids per project id; picking a project drops a member outside it. */
  public readonly projectUserIds = input<Map<string, Set<string>>>(new Map());
  public readonly categories = input<string[]>([]);
  public readonly showCategory = input(false);

  public readonly filterChange = output<AnalyticsFilter>();
  public readonly filter = signal<AnalyticsFilter>({});
  public readonly selectedProject = computed(
    () => this.projects().find((p) => p.id === this.filter().projectId) ?? null,
  );

  public ngOnInit(): void {
    this.subscription = this.route.queryParams.subscribe((params) => {
      const resolved = this.filterUtils.resolveFilter(params);
      this.filter.set(resolved);
      this.filterChange.emit(resolved);
    });
  }

  public ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  public displayName(user: User): string {
    return getUserDisplayName(user);
  }

  public formatDate = formatDateInput;

  public onStatus(status: Status): void {
    this.update({ status });
  }

  public onUser(userId: string): void {
    this.update({ userId: userId || undefined });
  }

  public onProject(project: Project | null): void {
    const { userId } = this.filter();
    // Drop a team member who is not on the newly picked project.
    const keepUser =
      !project ||
      !userId ||
      !!this.projectUserIds().get(project.id)?.has(userId);
    this.update({
      projectId: project?.id,
      ...(keepUser ? {} : { userId: undefined }),
    });
  }

  public onCategory(category: string): void {
    this.update({ category: category || undefined });
  }

  public onRange(dateRange: DateRange): void {
    const { start, end } = this.filterUtils.calculateDateRangeBounds(
      dateRange,
      this.filter().start,
      this.filter().end,
    );
    this.update({ dateRange, start, end });
  }

  public onCustomDate(edge: 'start' | 'end', value: string): void {
    if (!value) return;
    const [y, m, d] = value.split('-').map(Number);
    if (![y, m, d].every((v) => !isNaN(v))) return;
    const date =
      edge === 'start'
        ? new Date(y, m - 1, d, 0, 0, 0, 0)
        : new Date(y, m - 1, d, 23, 59, 59, 999);
    this.update({ [edge]: date });
  }

  private update(partial: Partial<AnalyticsFilter>): void {
    this.filterUtils.updateQueryParams(this.route, {
      ...this.filter(),
      ...partial,
    });
  }
}
