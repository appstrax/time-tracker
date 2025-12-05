import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatComponent, SplitPaneComponent } from '@components';
import { SplitPaneVerticalComponent, HistoryComponent } from '@components';

@Component({
  selector: 'app-repos',
  templateUrl: './repos.page.html',
  styleUrls: ['./repos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ChatComponent,
    HistoryComponent,
    SplitPaneComponent,
    SplitPaneVerticalComponent,
  ],
})
export class ReposPage {
  public repoSuggestions: any[] = [
    { icon: 'bi bi-git', prompt: 'List open pull requests' },
    { icon: 'bi bi-branch', prompt: 'Show recent commits for frontend' },
    { icon: 'bi bi-cpu', prompt: 'What is the build status of main?' },
  ];

  public repoContext: any = {
    page: 'repos',
    purpose: 'Help explore repositories, PRs, branches and build status',
    repositories: [],
    defaultBranch: 'main',
    outputs: ['Open PRs', 'Recent commits', 'Build status summary']
  };

  constructor() {}
} 