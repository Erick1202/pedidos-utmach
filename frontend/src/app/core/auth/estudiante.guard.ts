import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Carrito y pedidos son solo para estudiantes; el admin vuelve a su panel. */
export const estudianteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticado()) {
    return router.createUrlTree(['/login']);
  }

  return auth.esAdmin() ? router.createUrlTree(['/admin']) : true;
};
