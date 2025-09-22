import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent } from '../../components/chat/chat.component';

@Component({
  selector: 'app-define',
  templateUrl: './define.page.html',
  styleUrls: ['./define.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, ChatComponent],
})
export class DefinePage {
  constructor() {}
}