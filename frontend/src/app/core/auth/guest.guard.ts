import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Evita que un usuario con sesión vuelva a las pantallas de acceso. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticado()) {
    return true;
  }

  return router.createUrlTree([auth.esAdmin() ? '/admin' : '/menu']);
};
