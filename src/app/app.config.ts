import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AppstraxServices } from '@appstrax/services';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

AppstraxServices.init({
  apiUrl: environment.appstraxServicesUrl,
  apiKey: environment.appstraxServicesApiKey
});

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
};
