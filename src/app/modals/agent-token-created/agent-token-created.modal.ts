import { Component, Input, computed, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ToastService } from '@services';

export type AgentConnectTool = 'cursor' | 'claude';

@Component({
  standalone: true,
  templateUrl: './agent-token-created.modal.html',
  styleUrl: './agent-token-created.modal.scss',
})
export class AgentTokenCreatedModal {
  @Input({ required: true }) token!: string;
  @Input({ required: true }) mcpUrl!: string;
  @Input({ required: true }) mcpServerName!: string;

  readonly connectTool = signal<AgentConnectTool>('cursor');

  readonly claudeConnectCommand = computed(
    () =>
      `claude mcp add --transport http ${this.mcpServerName} ${this.mcpUrl} --header "Authorization: Bearer ${this.token}"`,
  );

  readonly cursorMcpConfig = computed(() =>
    JSON.stringify(
      {
        mcpServers: {
          [this.mcpServerName]: {
            url: this.mcpUrl,
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          },
        },
      },
      null,
      2,
    ),
  );

  readonly activeConnectSnippet = computed(() =>
    this.connectTool() === 'claude'
      ? this.claudeConnectCommand()
      : this.cursorMcpConfig(),
  );

  private readonly toast = inject(ToastService);

  constructor(public activeModal: NgbActiveModal) {}

  setConnectTool(tool: AgentConnectTool): void {
    this.connectTool.set(tool);
  }

  copyToken(): void {
    void this.copyToClipboard(this.token, 'Token copied to clipboard.');
  }

  copyConnectSnippet(): void {
    const label =
      this.connectTool() === 'claude' ? 'Command copied.' : 'Config copied.';
    void this.copyToClipboard(this.activeConnectSnippet(), label);
  }

  private async copyToClipboard(text: string, successMessage: string): Promise<void> {
    if (!navigator.clipboard) {
      this.toast.error('Clipboard is not available. Please copy manually.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      this.toast.success(successMessage);
    } catch {
      this.toast.error('Could not copy to clipboard. Please copy manually.');
    }
  }

  acknowledge(): void {
    this.activeModal.close();
  }
}
