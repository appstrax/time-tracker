import { Component, OnInit } from '@angular/core';
import { ThemeService } from '@services';
import { RouterOutlet } from '@angular/router';
import { appstraxAuth } from '@appstrax/services/auth';

import { Store } from '@state';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'machine-site';

  constructor(private theme: ThemeService, private store: Store) {}

  async ngOnInit(): Promise<void> {
    const authenticated = await appstraxAuth.isAuthenticated();
    if (authenticated) {
      // TODO: handle catch and show error toast if services are down
      await this.store.init();
    }
  }
}
