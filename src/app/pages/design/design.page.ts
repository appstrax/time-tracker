import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent } from '../../components/chat/chat.component';
import { SplitPaneComponent } from '../../components/split-pane/split-pane.component';
import { SplitPaneVerticalComponent } from '../../components/split-pane-vertical/split-pane-vertical.component';
import { HistoryComponent } from '../../components/history/history.component';

@Component({
  selector: 'app-design',
  templateUrl: './design.page.html',
  styleUrls: ['./design.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, ChatComponent, SplitPaneComponent, SplitPaneVerticalComponent, HistoryComponent],
})
export class DesignPage {
  public designSuggestions: any[] = [
    { icon: 'bi bi-magic', prompt: 'Design a new Todo List app' },
  ];

  public designContext: any = {
    page: 'design',
    purpose: 'Create and iterate on UI/UX design concepts',
    tools: ['Figma'],
    designSystem: 'Appstrax',
    outputs: ['Design brief', 'Wireframes', 'Component list']
  };

  constructor() {}
}