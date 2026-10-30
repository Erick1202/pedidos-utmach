import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEsEc from '@angular/common/locales/es-EC';
import { provideRouter } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { routes } from './app.routes';

// Precios en USD con el formato local de Ecuador (por ejemplo, «$1,50»).
registerLocaleData(localeEsEc);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-EC' },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(AuthService).restaurarSesion()),
  ],
};
