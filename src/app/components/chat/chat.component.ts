import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-chat',
  imports: [CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  @Input() placeholder: string = '';
  @ViewChild('promptInput') promptInput!: ElementRef;

  @Input() suggestions: any[] = [];

  messages: Array<{ role: 'user' | 'assistant'; text: string }> = [];

  get hasConversation(): boolean {
    return this.messages.length > 0;
  }

  constructor() {}

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
    // Placeholder assistant echo for now
    setTimeout(() => {
      this.messages.push({ role: 'assistant', text: 'Thanks! I will process: ' + value });
    }, 400);
  }
}
