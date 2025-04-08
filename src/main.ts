import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

if (environment.production) {
  console.log('Running in production mode');
} else if (environment.staging) {
  console.log('Running in staging mode');
} else {
  console.log('Running in development mode');
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
