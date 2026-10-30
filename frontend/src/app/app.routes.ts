import type { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((modulo) => modulo.Login),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/registro/registro').then((modulo) => modulo.Registro),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout').then((modulo) => modulo.Layout),
    children: [
      {
        path: 'menu',
        loadComponent: () => import('./features/menu/menu').then((modulo) => modulo.Menu),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin').then((modulo) => modulo.Admin),
      },
      { path: '', pathMatch: 'full', redirectTo: 'menu' },
    ],
  },
  { path: '**', redirectTo: 'menu' },
];
