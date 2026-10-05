import { AnalyticsFilter, TimeSheetEntry } from '@models';

/** Applies the shared analytics filter (dates, user, category, status) to entries. */
export function filterAnalyticsEntries(
  entries: TimeSheetEntry[],
  filter: AnalyticsFilter,
): TimeSheetEntry[] {
  return entries.filter((e) => {
    if (filter.start && e.date < filter.start) return false;
    if (filter.end && e.date > filter.end) return false;
    if (filter.userId && e.userId !== filter.userId) return false;
    if (filter.category && e.category !== filter.category) return false;
    if (filter.status === 'approved' && !e.approved) return false;
    if (filter.status === 'pending' && e.approved) return false;
    return true;
  });
}

export function formatDateInput(date?: Date): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
