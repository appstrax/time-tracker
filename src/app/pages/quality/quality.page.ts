import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-quality',
  templateUrl: './quality.page.html',
  styleUrls: ['./quality.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class QualityPage {
  constructor() {}
} 