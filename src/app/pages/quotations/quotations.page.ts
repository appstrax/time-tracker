import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-quotations',
  templateUrl: './quotations.page.html',
  styleUrls: ['./quotations.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class QuotationsPage {
  constructor() {}
} 