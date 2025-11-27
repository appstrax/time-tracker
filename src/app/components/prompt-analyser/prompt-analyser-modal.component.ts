import { CommonModule } from '@angular/common';
import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-prompt-analyser-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Improve your prompt</h5>
      <button #closeBtn type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body" style="max-height: 80vh; overflow: auto;">
      <div class="mb-3">
        <div class="small mb-1" style="color: var(--text-primary); opacity: 0.85;">Your prompt</div>
        <pre class="p-2 border rounded" style="white-space: pre-wrap; background: var(--color-surface); color: var(--text-primary);">{{ promptText || '—' }}</pre>
      </div>
      <div class="mb-2 fw-500">Suggestions</div>
      <ul class="mb-0">
        <li>State the goal clearly (what outcome do you want?).</li>
        <li>Add context (domain, tech stack, target users, constraints).</li>
        <li>Specify format (bullet list, JSON schema, table, code).</li>
        <li>Define constraints (time, budget, scope, style, tone).</li>
        <li>Provide examples of good/acceptable outputs.</li>
      </ul>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-primary" (click)="activeModal.close()">Close</button>
    </div>
  `,
})
export class PromptAnalyserModalComponent implements AfterViewInit {
  @Input() promptText: string = '';
  @ViewChild('closeBtn') closeBtn?: ElementRef<HTMLButtonElement>;
  constructor(public activeModal: NgbActiveModal) {}
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.closeBtn?.nativeElement?.focus?.();
    });
  }
}


