import { Component, Input, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-chat-context-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Chat Context</h5>
      <button type="button" class="btn-close" aria-label="Close" (click)="onCancel()"></button>
    </div>
    <div class="modal-body" style="max-height: 80vh; overflow: auto;">
      <p class="mb-2" style="font-size: 0.85rem; color: var(--text-primary);">
        This JSON object will be sent along with your prompt to give the agent page-specific context.
      </p>
      <textarea
        #editor
        [(ngModel)]="editableJson"
        class="form-control font-monospace"
        style="font-size: 0.85rem; line-height: 1.25;"
        rows="16"
        spellcheck="false"
      ></textarea>
      <div *ngIf="parseError" class="text-danger mt-2 small">
        {{ parseError }}
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" (click)="onCancel()">Cancel</button>
      <button type="button" class="btn btn-primary" (click)="onSave()">Save</button>
    </div>
  `,
})
export class ChatContextModalComponent implements AfterViewInit {
  @Input() context: any = {};
  @ViewChild('editor') editor?: ElementRef<HTMLTextAreaElement>;

  editableJson: string = '';
  parseError: string | null = null;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    this.editableJson = JSON.stringify(this.context ?? {}, null, 2);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.editor?.nativeElement) {
        this.editor.nativeElement.scrollTop = 0;
        this.editor.nativeElement.focus();
      }
    });
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  onSave(): void {
    this.parseError = null;
    try {
      const parsed = JSON.parse(this.editableJson || '{}');
      this.activeModal.close(parsed);
    } catch (e: unknown) {
      this.parseError = 'Invalid JSON. Please fix the JSON and try again.';
    }
  }
}


