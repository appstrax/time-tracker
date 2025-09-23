import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-chat',
  imports: [CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  @Input() title: string = 'Feed The Machine.';
  @Input() subtitle: string = 'Watch your project take shape.';
  @ViewChild('promptInput') promptInput!: ElementRef;

  @Input() suggestions: any[] = [];

  constructor() {}

  public ngAfterViewInit() {
    this.promptInput?.nativeElement.focus();
  }

  public onSuggestionClick(suggestion: any) {
    this.promptInput.nativeElement.value = suggestion.prompt;
    this.promptInput.nativeElement.focus();
  }
}
