import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AppstraxServices } from '@appstrax/services';

import { environment } from '../environments/environment';

import { routes } from './app.routes';

AppstraxServices.init({
  apiUrl: environment.appstraxServicesUrl,
  apiKey: environment.appstraxServicesApiKey
}).catch((err) => {
  console.error('Failed to initialize AppstraxServices', err);
});

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter(routes)]
};
