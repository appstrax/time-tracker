import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  appstraxAuth,
  User as AuthUser,
} from '@appstrax/services/auth';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

import { User } from '@models';

interface UsersApiResponse {
  data: AuthUser[];
  meta?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  async findByUserIds(userIds: string[]): Promise<User[]> {
    if (!userIds.length) return [];
    return this.fetchFromApi(userIds);
  }

  async fetchUsers(): Promise<User[]> {
    return this.fetchFromApi();
  }

  private async fetchFromApi(userIds?: string[]): Promise<User[]> {
    const token = await appstraxAuth.getAuthToken();
    const response = await firstValueFrom(
      this.http.get<UsersApiResponse>(`${environment.apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: userIds?.length ? { userIds: userIds.join(',') } : undefined,
      }),
    );
    return (response.data ?? []).map((x) => User.fromAuthUser(x));
  }
}
