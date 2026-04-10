import { Injectable } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import {
  DateRange,
  AnalyticsFilter,
  Status,
} from '../models/analytics-filter.model';

@Injectable({ providedIn: 'root' })
export class TimeSheetFilterUtil {
  private readonly allowedStatuses: Status[] = ['all', 'approved', 'pending'];
  private readonly allowedDateRanges: DateRange[] = [
    'week',
    'month',
    'year',
    'all',
    'custom',
  ];

  constructor(private router: Router) {}

  public parseFilters(params: Params): AnalyticsFilter {
    return {
      projectId: params['projectId'] ?? undefined,
      userId: params['userId'] ?? undefined,
      category: params['category'] ?? undefined,
      status: this.parseStatus(params['status']),
      dateRange: this.parseDateRange(params['dateRange']),
      start: this.parseDate(params['start']),
      end: this.parseDate(params['end']),
    };
  }

  private parseStatus(status: Status | undefined): Status {
    if (!status) return 'all';
    return this.allowedStatuses.includes(status) ? status : 'all';
  }

  private parseDateRange(dateRange: DateRange | undefined): DateRange {
    if (!dateRange) return 'month';
    return this.allowedDateRanges.includes(dateRange) ? dateRange : 'month';
  }

  private parseDate(value: any): Date | undefined {
    if (!value) return undefined;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }

  public updateQueryParams(
    route: ActivatedRoute,
    filter: AnalyticsFilter,
  ): Promise<boolean> {
    const queryParams = this.buildQueryParams(filter);
    return this.router.navigate([], {
      relativeTo: route,
      queryParams,
      replaceUrl: true,
    });
  }

  public buildQueryParams(filter: AnalyticsFilter): Params {
    const queryParams: Params = {};

    if (filter.projectId) queryParams['projectId'] = filter.projectId;
    if (filter.userId) queryParams['userId'] = filter.userId;
    if (filter.status) queryParams['status'] = filter.status;
    if (filter.dateRange) queryParams['dateRange'] = filter.dateRange;
    if (filter.category) queryParams['category'] = filter.category;
    if (filter.start) queryParams['start'] = filter.start.toISOString();
    if (filter.end) queryParams['end'] = filter.end.toISOString();

    return queryParams;
  }

  public calculateDateRangeBounds(
    dateRange: DateRange,
    start?: Date,
    end?: Date,
  ): { start: Date; end: Date } {
    const today = new Date();
    switch (dateRange) {
      case 'week': {
        return {
          start: this.startOfWeek(today),
          end: this.endOfWeek(today),
        };
      }
      case 'month': {
        return {
          start: this.startOfMonth(today),
          end: this.endOfMonth(today),
        };
      }
      case 'year': {
        return {
          start: this.startOfYear(today),
          end: this.endOfYear(today),
        };
      }
      case 'all': {
        return {
          start: new Date(0),
          end: this.endOfDay(today),
        };
      }
      case 'custom':
      default: {
        return {
          start: start ?? this.startOfDay(today),
          end: end ?? this.endOfDay(today),
        };
      }
    }
  }

  private startOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private endOfWeek(date: Date): Date {
    const end = this.startOfWeek(date);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  private endOfMonth(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
  }

  private startOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
  }

  private endOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  private startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private endOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }
}
