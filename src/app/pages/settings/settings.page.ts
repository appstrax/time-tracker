import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SettingsService } from '@services';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  constructor(public settings: SettingsService) {}

  toggleAutoCollapse(event: Event) {
    const target = event.target as HTMLInputElement;
    this.settings.setAutoCollapse(target.checked);
  }
}


