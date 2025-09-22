import { Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  @Input() title: string = 'Feed The Machine.';
  @Input() subtitle: string = 'Watch your project take shape.';
  @ViewChild('promptInput') promptInput!: ElementRef;

  constructor() {}

  ngAfterViewInit() {
    this.promptInput?.nativeElement.focus();
  }
}
