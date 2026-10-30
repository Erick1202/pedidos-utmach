import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from './token-storage.service';

/** Adjunta el JWT solo a las peticiones dirigidas a nuestra API. */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const token = inject(TokenStorageService).obtenerToken();

  if (!token || !peticion.url.startsWith(environment.apiUrl)) {
    return siguiente(peticion);
  }

  return siguiente(
    peticion.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
