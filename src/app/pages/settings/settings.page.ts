import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SettingsService, ThemeService } from '@services';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  constructor(public settings: SettingsService, public theme: ThemeService) {}

  toggleAutoCollapse(event: Event) {
    const target = event.target as HTMLInputElement;
    this.settings.setAutoCollapse(target.checked);
  }

  onThemeChange(mode: 'light' | 'dark' | 'system' | 'custom') {
    this.theme.setTheme(mode);
  }

  custom = {
    primary: '#8a00b4',
    bg: '#f8f9fa',
    surface: '#ffffff',
    text: '#1a1a1a',
  };

  applyCustom() {
    const vars = {
      '--color-primary': this.custom.primary,
      '--color-bg': this.custom.bg,
      '--color-surface': this.custom.surface,
      '--text-primary': this.custom.text,
      '--bs-body-bg': this.custom.bg,
      '--bs-body-color': this.custom.text,
      '--bs-primary': this.custom.primary,
    } as Record<string, string>;
    this.theme.setTheme('custom', vars);
  }

  resetCustom() {
    this.custom = {
      primary: '#8a00b4',
      bg: '#f8f9fa',
      surface: '#ffffff',
      text: '#1a1a1a',
    };
    this.theme.setTheme('light');
  }
}


