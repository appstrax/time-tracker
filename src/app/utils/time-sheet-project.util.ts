const LAST_SELECTED_PROJECT_KEY = 'timeSheet.lastProjectId';

export function getStoredTimeSheetProjectId(): string | null {
  try {
    return localStorage.getItem(LAST_SELECTED_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function storeTimeSheetProjectId(projectId: string): void {
  if (!projectId) return;
  try {
    localStorage.setItem(LAST_SELECTED_PROJECT_KEY, projectId);
  } catch {}
}

export function clearStoredTimeSheetProjectId(): void {
  try {
    localStorage.removeItem(LAST_SELECTED_PROJECT_KEY);
  } catch {}
}
