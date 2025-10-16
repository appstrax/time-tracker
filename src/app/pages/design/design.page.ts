import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent } from '../../components/chat/chat.component';
import { SplitPaneComponent } from '../../components/split-pane/split-pane.component';

@Component({
  selector: 'app-design',
  templateUrl: './design.page.html',
  styleUrls: ['./design.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, ChatComponent, SplitPaneComponent],
})
export class DesignPage {
  public designSuggestions: any[] = [
    { icon: 'bi bi-magic', prompt: 'Design a new Todo List app' },
  ];

  constructor() {}
}