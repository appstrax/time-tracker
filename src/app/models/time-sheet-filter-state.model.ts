export type TimeSheetStatusFilter = 'all' | 'approved' | 'pending';
export type TimeSheetDateRangeFilter = 'week' | 'month' | 'year' | 'all' | 'custom';

export interface TimeSheetFilterState {
  organizationId?: string | null;
  projectId?: string | null;
  userId?: string | null;
  dateRange: TimeSheetDateRangeFilter;
  startDate: Date | null;
  endDate: Date | null;
  status: TimeSheetStatusFilter;
  category?: string | null;
}

