import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { appstraxAuth } from '@appstrax/services/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

export interface AgentTokenScopeDefinition {
  id: string;
  label: string;
  description: string;
  adminOnly?: boolean;
}

export interface AgentTokenRecord {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  projectScope: 'all' | 'selected';
  projectIds: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateAgentTokenPayload {
  name: string;
  scopes: string[];
  projectScope: 'all' | 'selected';
  projectIds?: string[];
  expiresAt?: string | null;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AgentTokenService {
  constructor(private http: HttpClient) {}

  async listScopeDefinitions(): Promise<AgentTokenScopeDefinition[]> {
    const response = await this.request<AgentTokenScopeDefinition[]>(
      'GET',
      '/api/agent-tokens/scopes',
    );
    return response;
  }

  async listTokens(): Promise<AgentTokenRecord[]> {
    return this.request<AgentTokenRecord[]>('GET', '/api/agent-tokens');
  }

  async createToken(
    payload: CreateAgentTokenPayload,
  ): Promise<{ token: string; record: AgentTokenRecord }> {
    return this.request<{ token: string; record: AgentTokenRecord }>(
      'POST',
      '/api/agent-tokens',
      payload,
    );
  }

  async revokeToken(id: string): Promise<void> {
    await this.request('DELETE', `/api/agent-tokens/${id}`);
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await appstraxAuth.getAuthToken();
    const url = `${environment.apiUrl}${path}`;
    const options = {
      headers: { Authorization: `Bearer ${token}` },
    };

    let response: ApiResponse<T>;
    if (method === 'GET') {
      response = await firstValueFrom(
        this.http.get<ApiResponse<T>>(url, options),
      );
    } else if (method === 'POST') {
      response = await firstValueFrom(
        this.http.post<ApiResponse<T>>(url, body, options),
      );
    } else {
      response = await firstValueFrom(
        this.http.delete<ApiResponse<T>>(url, options),
      );
    }

    return response.data;
  }

  static readErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string } | null;
      if (body?.message) {
        return body.message;
      }
      if (error.status === 0) {
        return 'Cannot reach the Time Tracker API. Is it running on the configured URL?';
      }
      return `${fallback} (HTTP ${error.status})`;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  }
}
