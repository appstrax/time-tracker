import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-guardrails',
  templateUrl: './guardrails.page.html',
  styleUrls: ['./guardrails.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class GuardrailsPage {
  constructor() {}
} 