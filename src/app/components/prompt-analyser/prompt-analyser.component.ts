import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-prompt-analyser',
  standalone: true,
  imports: [CommonModule, NgbTooltip],
  styles: [`
    .icon-button {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.15rem 0.35rem;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      background-color: var(--color-surface);
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .icon-button i {
      color: var(--primary-color);
      font-size: 0.85rem;
    }
    .icon-button:hover {
      background-color: var(--primary-color);
      color: var(--color-primary-contrast);
      border-color: var(--primary-color);
    }
    .icon-button:hover i {
      color: var(--color-primary-contrast);
    }
  `],
  template: `
    <div class="d-flex align-items-center gap-2">
      <span class="small" style="color: var(--text-primary); opacity: 0.85;">Prompt score:</span>
      <span class="fw-500" [style.color]="scoreColor">{{ score }}%</span>
      <button
        class="icon-button"
        type="button"
        aria-label="Improve prompt"
        ngbTooltip="Improve prompt"
        [placement]="tooltipPlacement"
        (click)="openImproveModal()"
      >
        <i class="bi bi-info-circle"></i>
      </button>
    </div>
  `,
})
export class PromptAnalyserComponent {
  @Input() text: string = '';
  @Input() tooltipPlacement: 'top' | 'bottom' | 'left' | 'right' | 'auto' = 'bottom';

  constructor(private modalService: ModalService) {}

  get score(): number {
    return this.computeScore(this.text);
  }

  get scoreColor(): string {
    const s = this.score;
    if (s >= 80) return 'var(--bs-success)';
    if (s >= 60) return 'var(--bs-warning)';
    return 'var(--bs-danger)';
  }

  openImproveModal() {
    // Blur the trigger to avoid focused element being inside aria-hidden subtree
    try { (document.activeElement as HTMLElement | null)?.blur?.(); } catch {}
    this.modalService.showPromptAnalyserModal(this.text);
  }

  private computeScore(value: string): number {
    if (!value) return 0;
    const lengthScore = Math.min(60, Math.floor((value.length / 200) * 60));
    const hasGoal = /(build|create|design|explain|summarize|list|generate|implement)/i.test(value) ? 15 : 0;
    const hasContext = /(for|about|using|with|in|target|users|stack|framework)/i.test(value) ? 15 : 0;
    const hasConstraints = /(deadline|budget|scope|limit|constraints|must|should)/i.test(value) ? 10 : 0;
    return Math.max(0, Math.min(100, lengthScore + hasGoal + hasContext + hasConstraints));
  }
}


