import type { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { estudianteGuard } from './core/auth/estudiante.guard';
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
        path: 'carrito',
        canActivate: [estudianteGuard],
        loadComponent: () => import('./features/carrito/carrito').then((modulo) => modulo.Carrito),
      },
      {
        path: 'confirmar-pedido',
        canActivate: [estudianteGuard],
        loadComponent: () =>
          import('./features/confirmar-pedido/confirmar-pedido').then(
            (modulo) => modulo.ConfirmarPedido,
          ),
      },
      {
        path: 'mis-pedidos',
        canActivate: [estudianteGuard],
        loadComponent: () =>
          import('./features/mis-pedidos/mis-pedidos').then((modulo) => modulo.MisPedidos),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/admin').then((modulo) => modulo.Admin),
          },
          {
            path: 'productos',
            loadComponent: () =>
              import('./features/admin/productos/admin-productos').then(
                (modulo) => modulo.AdminProductos,
              ),
          },
          {
            path: 'pedidos',
            loadComponent: () =>
              import('./features/admin/pedidos/admin-pedidos').then(
                (modulo) => modulo.AdminPedidos,
              ),
          },
          {
            path: 'categorias',
            loadComponent: () =>
              import('./features/admin/categorias/admin-categorias').then(
                (modulo) => modulo.AdminCategorias,
              ),
          },
        ],
      },
      { path: '', pathMatch: 'full', redirectTo: 'menu' },
    ],
  },
  { path: '**', redirectTo: 'menu' },
];
