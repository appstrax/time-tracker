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
    if (mode === 'custom') {
      this.theme.setTheme('custom', this.buildCustomVars());
    } else {
      this.theme.setTheme(mode);
    }
  }

  custom = {
    primary: '#8a00b4',
    primaryContrast: '#ffffff',
    bg: '#f8f9fa',
    surface: '#ffffff',
    border: '#e6e6e6',
    text: '#1a1a1a',
    muted: '#666666',
  };

  applyCustom() {
    this.theme.setTheme('custom', this.buildCustomVars());
  }

  resetCustom() {
    this.custom = {
      primary: '#8a00b4',
      primaryContrast: '#ffffff',
      bg: '#f8f9fa',
      surface: '#ffffff',
      border: '#e6e6e6',
      text: '#1a1a1a',
      muted: '#666666',
    };
    this.theme.clearCustomVars();
    this.theme.setTheme('light');
  }

  private buildCustomVars(): Record<string, string> {
    return {
      // Semantic tokens
      '--color-primary': this.custom.primary,
      '--color-primary-contrast': this.custom.primaryContrast,
      '--color-bg': this.custom.bg,
      '--color-surface': this.custom.surface,
      '--color-border': this.custom.border,
      '--text-primary': this.custom.text,
      '--text-muted': this.custom.muted,
      // Legacy/mapped tokens
      '--primary-color': this.custom.primary,
      '--primary-color-dark': `color-mix(in srgb, ${this.custom.primary} 70%, #000)`,
      '--primary-color-light': `color-mix(in srgb, ${this.custom.primary} 8%, transparent)`,
      // Bootstrap mappings
      '--bs-body-bg': this.custom.bg,
      '--bs-body-color': this.custom.text,
      '--bs-primary': this.custom.primary,
      '--bs-border-color': this.custom.border,
    } as Record<string, string>;
  }
}


