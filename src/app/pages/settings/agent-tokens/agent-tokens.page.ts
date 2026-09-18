import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';

import { AgentTokenCreatedModal, ConfirmModalComponent } from '@modals';
import {
  AgentTokenRecord,
  AgentTokenScopeDefinition,
  AgentTokenService,
  CreateAgentTokenPayload,
  ToastService,
} from '@services';
import { Store } from '@state';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-agent-tokens',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgSelectComponent],
  templateUrl: './agent-tokens.page.html',
  styleUrls: ['./agent-tokens.page.scss'],
})
export class AgentTokensPage implements OnInit {
  private readonly agentTokenService = inject(AgentTokenService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(Store);
  private readonly modalService = inject(NgbModal);

  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly tokens = signal<AgentTokenRecord[]>([]);
  readonly scopeDefinitions = signal<AgentTokenScopeDefinition[]>([]);

  private readonly mcpServerName = 'timetracker';

  readonly projects = computed(() => this.store.projects.projects());

  name = '';
  expiresAt = '';
  projectScope: 'all' | 'selected' = 'all';
  selectedProjectIds = signal<string[]>([]);
  selectedScopes = signal<Record<string, boolean>>({
    read: true,
    'time:write': false,
    'users:read': false,
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const user = this.store.user.user();
      if (user) {
        await this.store.projects.fetchUserProjects(user);
      }
      const [scopesResult, tokensResult] = await Promise.allSettled([
        this.agentTokenService.listScopeDefinitions(),
        this.agentTokenService.listTokens(),
      ]);

      if (scopesResult.status === 'fulfilled') {
        this.scopeDefinitions.set(scopesResult.value);
        const scopeMap: Record<string, boolean> = { ...this.selectedScopes() };
        for (const scope of scopesResult.value) {
          if (scopeMap[scope.id] === undefined) {
            scopeMap[scope.id] = scope.id === 'read';
          }
        }
        this.selectedScopes.set(scopeMap);
      } else {
        this.toast.error(
          AgentTokenService.readErrorMessage(
            scopesResult.reason,
            'Could not load token scopes.',
          ),
        );
      }

      if (tokensResult.status === 'fulfilled') {
        this.tokens.set(tokensResult.value);
      } else {
        this.toast.error(
          AgentTokenService.readErrorMessage(
            tokensResult.reason,
            'Could not load your tokens.',
          ),
        );
      }
    } catch (error) {
      this.toast.error(
        AgentTokenService.readErrorMessage(error, 'Could not load agent tokens.'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  toggleScope(scopeId: string, checked: boolean): void {
    this.selectedScopes.update((current) => ({ ...current, [scopeId]: checked }));
  }

  onSelectedProjectsChange(projectIds: string[] | null): void {
    this.selectedProjectIds.set(projectIds ?? []);
  }

  async createToken(): Promise<void> {
    if (
      this.projectScope === 'selected' &&
      !this.selectedProjectIds().length
    ) {
      this.toast.error('Choose at least one project, or allow every project.');
      return;
    }

    let scopes = Object.entries(this.selectedScopes())
      .filter(([, enabled]) => enabled)
      .map(([id]) => id);

    if (!scopes.length) {
      scopes = ['read'];
      this.selectedScopes.update((current) => ({ ...current, read: true }));
    }

    const payload: CreateAgentTokenPayload = {
      name: this.name.trim(),
      scopes,
      projectScope: this.projectScope,
      projectIds:
        this.projectScope === 'selected' ? this.selectedProjectIds() : [],
      expiresAt: this.expiresAt ? new Date(this.expiresAt).toISOString() : null,
    };

    this.creating.set(true);
    try {
      const result = await this.agentTokenService.createToken(payload);
      this.tokens.update((list) => [result.record, ...list]);
      this.name = '';
      this.openCreatedTokenModal(result.token);
      this.toast.success('Agent token created. Copy it now — it will not be shown again.');
    } catch (error) {
      this.toast.error(
        AgentTokenService.readErrorMessage(error, 'Could not create agent token.'),
      );
    } finally {
      this.creating.set(false);
    }
  }

  confirmRevokeToken(token: AgentTokenRecord): void {
    const modal = this.modalService.open(ConfirmModalComponent, {
      centered: true,
    });
    modal.componentInstance.title = 'Revoke agent token';
    modal.componentInstance.headerClass = 'bg-danger text-white';
    modal.componentInstance.confirmButtonClass = 'btn-danger';
    modal.componentInstance.confirmButtonText = 'Revoke';
    modal.componentInstance.cancelButtonText = 'Cancel';
    modal.componentInstance.message = `Revoke "${token.name}"? Any agent using this token will lose access immediately. This cannot be undone.`;
    modal.componentInstance.onConfirm = () => void this.revokeToken(token);
  }

  private async revokeToken(token: AgentTokenRecord): Promise<void> {
    try {
      await this.agentTokenService.revokeToken(token.id);
      this.tokens.update((list) => list.filter((t) => t.id !== token.id));
      this.toast.success('Token revoked.');
    } catch {
      this.toast.error('Could not revoke token.');
    }
  }

  formatProjects(token: AgentTokenRecord): string {
    if (token.projectScope === 'all') {
      return 'All';
    }
    const count = token.projectIds.length;
    return count === 1 ? '1 chosen' : `${count} chosen`;
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }

  private openCreatedTokenModal(token: string): void {
    const modalRef = this.modalService.open(AgentTokenCreatedModal, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
    });
    const base = environment.apiUrl.replace(/\/$/, '');
    modalRef.componentInstance.token = token;
    modalRef.componentInstance.mcpUrl = `${base}/mcp`;
    modalRef.componentInstance.mcpServerName = this.mcpServerName;
  }

}
