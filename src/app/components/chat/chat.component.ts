import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, AfterViewInit } from '@angular/core';
import { ModalService } from '../../services/modal.service';
import { ToastService } from '../../services/toast.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { PromptAnalyserComponent } from '../prompt-analyser/prompt-analyser.component';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, NgbTooltip, PromptAnalyserComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements AfterViewInit {
  @Input() placeholder: string = '';
  @ViewChild('promptInput') promptInput!: ElementRef;
  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;

  @Input() suggestions: any[] = [];
  @Input() context: any = {};

  messages: Array<{ role: 'user' | 'assistant'; text: string }> = [];
  currentPrompt: string = '';

  get hasConversation(): boolean {
    return this.messages.length > 0;
  }

  private pendingTimer?: any;
  private isListening: boolean = false;
  private attachedFiles: File[] = [];

  constructor(private modalService: ModalService, private toast: ToastService) {}

  public ngAfterViewInit() {
    this.promptInput?.nativeElement.focus();
  }

  public onSuggestionClick(suggestion: any) {
    this.promptInput.nativeElement.value = suggestion.prompt;
    this.currentPrompt = suggestion.prompt;
    this.promptInput.nativeElement.focus();
  }

  public onSend() {
    const value = (this.promptInput.nativeElement.value || '').trim();
    if (!value) return;
    // Push user message
    this.messages.push({ role: 'user', text: value });
    this.promptInput.nativeElement.value = '';
    this.currentPrompt = '';
    this.scrollToBottom();
    // Placeholder assistant echo for now
    this.pendingTimer = setTimeout(() => {
      this.messages.push({ role: 'assistant', text: 'Thanks! I will process: ' + value });
      this.scrollToBottom();
      this.pendingTimer = undefined;
    }, 400);
  }

  public openContextModal() {
    // Blur the trigger to avoid focused element being inside aria-hidden subtree
    try { (document.activeElement as HTMLElement | null)?.blur?.(); } catch {}
    const modalRef = this.modalService.showChatContextModal(this.context);
    modalRef.result.then(
      (updated: any) => {
        if (updated) {
          this.context = updated;
        }
      },
      () => {}
    );
  }

  public onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;
    this.attachedFiles.push(...files);
    this.toast.info(`${files.length} file(s) attached`);
    input.value = '';
  }

  public onVoiceInputToggle() {
    this.isListening = !this.isListening;
    this.toast.info(this.isListening ? 'Voice input: listening...' : 'Voice input: stopped');
  }

  public onRegenerate() {
    const lastUser = [...this.messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    if (this.pendingTimer) {
      this.toast.warning('Please stop current response first');
      return;
    }
    this.pendingTimer = setTimeout(() => {
      this.messages.push({ role: 'assistant', text: 'Regenerated response for: ' + lastUser.text });
      this.scrollToBottom();
      this.pendingTimer = undefined;
    }, 400);
  }

  public onStop() {
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = undefined;
      this.toast.info('Generation stopped');
    }
  }

  public onClear() {
    this.messages = [];
    this.toast.success('Conversation cleared');
  }

  public onInputChange(evt: Event) {
    const target = evt.target as HTMLInputElement | HTMLTextAreaElement;
    this.currentPrompt = target.value ?? '';
  }

  private scrollToBottom() {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return;
    // Wait for DOM to update (new message rendered) before measuring
    requestAnimationFrame(() => {
      const maxScrollTop = el.scrollHeight - el.clientHeight;
      el.scrollTop = maxScrollTop < 0 ? 0 : maxScrollTop;
    });
  }
}
