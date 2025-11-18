import { Injectable } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import {
  TimeSheetDateRangeFilter,
  TimeSheetFilterState,
  TimeSheetStatusFilter,
} from '../models/time-sheet-filter-state.model';

interface FilterParseOptions {
  preserveOrganizationAndProject?: boolean;
  defaultStatus?: TimeSheetStatusFilter;
  defaultDateRange?: TimeSheetDateRangeFilter;
}

interface FilterQueryParamOptions {
  includeOrganizationAndProject?: boolean;
  preserveExistingOrgProject?: boolean;
  organizationId?: string | null;
  projectId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TimeSheetFilterUtilsService {
  private readonly allowedStatuses: TimeSheetStatusFilter[] = ['all', 'approved', 'pending'];
  private readonly allowedDateRanges: TimeSheetDateRangeFilter[] = ['week', 'month', 'year', 'all', 'custom'];

  constructor(private router: Router) {}

  public parseFiltersFromParams(
    params: Params,
    current: TimeSheetFilterState,
    options?: FilterParseOptions
  ): TimeSheetFilterState {
    const defaults: Required<FilterParseOptions> = {
      preserveOrganizationAndProject: true,
      defaultStatus: 'all',
      defaultDateRange: 'month',
      ...options,
    };

    const next: TimeSheetFilterState = { ...current };

    // Organization
    if (params['organizationId'] !== undefined) {
      next.organizationId = this.normalizeNullable(params['organizationId']);
    } else if (!defaults.preserveOrganizationAndProject) {
      next.organizationId = null;
    }

    // Project
    if (params['projectId'] !== undefined) {
      next.projectId = this.normalizeNullable(params['projectId']);
    } else if (!defaults.preserveOrganizationAndProject) {
      next.projectId = null;
    }

    // Simple text fields
    next.userId = this.normalizeString(params['userId']);
    next.category = this.normalizeString(params['category']);

    // Status
    const statusParam = params['status'];
    next.status = this.allowedStatuses.includes(statusParam) ? statusParam : defaults.defaultStatus;

    // Date range
    const dateRangeParam = params['dateRange'];
    next.dateRange = this.allowedDateRanges.includes(dateRangeParam)
      ? dateRangeParam
      : defaults.defaultDateRange;

    const startParam = this.parseDate(params['startDate']);
    const endParam = this.parseDate(params['endDate']);

    const { startDate, endDate } = this.calculateDateRangeBounds(
      next.dateRange,
      startParam,
      endParam,
      next.startDate,
      next.endDate
    );

    next.startDate = startDate;
    next.endDate = endDate;

    return next;
  }

  public async syncFiltersToUrl(
    route: ActivatedRoute,
    filters: TimeSheetFilterState,
    options?: FilterQueryParamOptions
  ): Promise<boolean> {
    const queryParams = this.buildQueryParams(route, filters, options);
    return this.router.navigate([], {
      relativeTo: route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  public buildQueryParams(
    route: ActivatedRoute,
    filters: TimeSheetFilterState,
    options?: FilterQueryParamOptions
  ): Params {
    const existingParams = route.snapshot.queryParams ?? {};
    const queryParams: Params = {};

    const { organizationId, projectId } = this.resolveOrganizationProjectParams(filters, existingParams, options);

    if (organizationId !== undefined) {
      queryParams['organizationId'] = this.normalizeNullable(organizationId);
    }
    if (projectId !== undefined) {
      queryParams['projectId'] = this.normalizeNullable(projectId);
    }

    queryParams['userId'] = this.stringOrNull(filters.userId);
    queryParams['status'] = filters.status === 'all' ? null : filters.status;
    queryParams['dateRange'] = filters.dateRange === 'month' ? null : filters.dateRange;
    queryParams['category'] = this.stringOrNull(filters.category);
    queryParams['startDate'] = filters.startDate ? filters.startDate.toISOString() : null;
    queryParams['endDate'] = filters.endDate ? filters.endDate.toISOString() : null;

    return queryParams;
  }

  public calculateDateRangeBounds(
    dateRange: TimeSheetDateRangeFilter,
    startInput?: Date | null,
    endInput?: Date | null,
    fallbackStart?: Date | null,
    fallbackEnd?: Date | null
  ): { startDate: Date; endDate: Date } {
    const today = new Date();
    switch (dateRange) {
      case 'week': {
        return {
          startDate: this.startOfWeek(today),
          endDate: this.endOfWeek(today),
        };
      }
      case 'month': {
        return {
          startDate: this.startOfMonth(today),
          endDate: this.endOfMonth(today),
        };
      }
      case 'year': {
        return {
          startDate: this.startOfYear(today),
          endDate: this.endOfYear(today),
        };
      }
      case 'all': {
        return {
          startDate: new Date(0),
          endDate: this.endOfDay(today),
        };
      }
      case 'custom':
      default: {
        const startDate = startInput ?? fallbackStart ?? this.startOfDay(today);
        const endDate = endInput ?? fallbackEnd ?? this.endOfDay(today);
        return {
          startDate,
          endDate,
        };
      }
    }
  }

  private resolveOrganizationProjectParams(
    filters: TimeSheetFilterState,
    existingParams: Params,
    options?: FilterQueryParamOptions
  ): { organizationId?: string | null; projectId?: string | null } {
    if (options?.includeOrganizationAndProject) {
      return {
        organizationId: filters.organizationId ?? null,
        projectId: filters.projectId ?? null,
      };
    }

    if (options?.organizationId !== undefined || options?.projectId !== undefined) {
      return {
        organizationId: options.organizationId ?? null,
        projectId: options.projectId ?? null,
      };
    }

    if (options?.preserveExistingOrgProject) {
      return {
        organizationId: existingParams['organizationId'] ?? null,
        projectId: existingParams['projectId'] ?? null,
      };
    }

    return {};
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
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
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

  private parseDate(value: any): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private normalizeNullable(value: any): string | null {
    if (value === undefined || value === null || value === '') return null;
    return value;
  }

  private normalizeString(value: any, defaultValue: string = ''): string {
    return typeof value === 'string' ? value : defaultValue;
  }

  private stringOrNull(value?: string | null): string | null {
    if (!value) return null;
    return value.trim().length === 0 ? null : value;
  }
}

