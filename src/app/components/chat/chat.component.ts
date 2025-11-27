import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, AfterViewInit } from '@angular/core';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-chat',
  imports: [CommonModule],
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

  get hasConversation(): boolean {
    return this.messages.length > 0;
  }

  constructor(private modalService: ModalService) {}

  public ngAfterViewInit() {
    this.promptInput?.nativeElement.focus();
  }

  public onSuggestionClick(suggestion: any) {
    this.promptInput.nativeElement.value = suggestion.prompt;
    this.promptInput.nativeElement.focus();
  }

  public onSend() {
    const value = (this.promptInput.nativeElement.value || '').trim();
    if (!value) return;
    // Push user message
    this.messages.push({ role: 'user', text: value });
    this.promptInput.nativeElement.value = '';
    this.scrollToBottom();
    // Placeholder assistant echo for now
    setTimeout(() => {
      this.messages.push({ role: 'assistant', text: 'Thanks! I will process: ' + value });
      this.scrollToBottom();
    }, 400);
  }

  public openContextModal() {
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
