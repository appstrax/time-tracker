import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-repos',
  templateUrl: './repos.page.html',
  styleUrls: ['./repos.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class ReposPage {
  constructor() {}
} 