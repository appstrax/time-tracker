export type Status = 'all' | 'approved' | 'pending';
export type DateRange = 'week' | 'month' | 'year' | 'all' | 'custom';

export interface AnalyticsFilter {
  projectId?: string;
  userId?: string;
  dateRange?: DateRange;
  start?: Date;
  end?: Date;
  status?: Status;
  category?: string;
}

