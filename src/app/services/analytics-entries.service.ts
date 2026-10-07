import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { appstraxAuth } from '@appstrax/services/auth';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

import { TimeSheetEntry } from '../models/time-sheet-entry.model';
import { TimeSheetFieldValue } from '../models/time-sheet-field.model';

interface EntryDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  projectId: string;
  date: string;
  hours: number;
  description: string;
  category: string;
  fieldValues: TimeSheetFieldValue[];
  approved: boolean;
  billable: boolean;
}

interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

const toEntry = (dto: EntryDto): TimeSheetEntry =>
  Object.assign(new TimeSheetEntry(), dto, {
    date: new Date(dto.date),
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    fieldValues: dto.fieldValues ?? [],
  });

/**
 * Server-scoped entry reads and approvals for the analytics pages. The API
 * decides which projects the caller may see, so viewers and approvers get
 * every member's rows (the collection itself only returns a user's own).
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsEntriesService {
  constructor(private http: HttpClient) {}

  async findByProjectIds(projectIds: string[]): Promise<TimeSheetEntry[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<EntryDto[]>>(this.url(), {
        headers: await this.headers(),
        params: projectIds.length ? { projectIds: projectIds.join(',') } : undefined,
      }),
    );
    return (response.data ?? []).map(toEntry);
  }

  async setApproved(
    entryId: string,
    approved: boolean,
  ): Promise<TimeSheetEntry> {
    const response = await firstValueFrom(
      this.http.put<ApiResponse<EntryDto>>(
        `${this.url()}/${encodeURIComponent(entryId)}/approval`,
        { approved },
        { headers: await this.headers() },
      ),
    );
    return toEntry(response.data);
  }

  private url(): string {
    return `${environment.apiUrl}/api/entries`;
  }

  private async headers(): Promise<{ Authorization: string }> {
    const token = await appstraxAuth.getAuthToken();
    return { Authorization: `Bearer ${token}` };
  }
}
