import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin',
  imports: [RouterLink],
  template: `
    <section class="space-y-6">
      <div
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-utmach-azul p-6 text-white shadow-xl shadow-slate-900/15 sm:p-8"
      >
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-utmach-amarillo/20"></div>
        <div class="relative">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-utmach-amarillo">
            Administración
          </p>
          <h1 class="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Panel del administrador
          </h1>
          <p class="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">
            Bienvenido, {{ usuario()?.nombre }}. Desde aquí administras el menú, los pedidos y los
            reportes del bar.
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a
          routerLink="/admin/productos"
          class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-utmach-azul-claro hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-utmach-azul-claro/30"
        >
          <p class="text-xs font-bold uppercase tracking-wide text-utmach-azul-claro">Catálogo</p>
          <h2 class="mt-2 text-lg font-bold text-slate-900 group-hover:text-utmach-azul">
            Productos →
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">
            Crea y edita productos, cambia precios y marca su disponibilidad.
          </p>
        </a>

        <a
          routerLink="/admin/categorias"
          class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-utmach-azul-claro hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-utmach-azul-claro/30"
        >
          <p class="text-xs font-bold uppercase tracking-wide text-utmach-azul-claro">Catálogo</p>
          <h2 class="mt-2 text-lg font-bold text-slate-900 group-hover:text-utmach-azul">
            Categorías →
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">
            Organiza el menú en categorías; los cambios de nombre llegan a los productos.
          </p>
        </a>

        <a
          routerLink="/admin/pedidos"
          class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-utmach-azul-claro hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-utmach-azul-claro/30"
        >
          <p class="text-xs font-bold uppercase tracking-wide text-utmach-azul-claro">Bar</p>
          <h2 class="mt-2 text-lg font-bold text-slate-900 group-hover:text-utmach-azul">
            Pedidos activos →
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">
            Atiende los pedidos del día y avánzalos de recibido a entregado.
          </p>
        </a>

        <a
          routerLink="/admin/reportes"
          class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-utmach-azul-claro hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-utmach-azul-claro/30"
        >
          <p class="text-xs font-bold uppercase tracking-wide text-utmach-azul-claro">Ventas</p>
          <h2 class="mt-2 text-lg font-bold text-slate-900 group-hover:text-utmach-azul">
            Reportes →
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">
            Más vendidos, ventas por día y categoría, hora pico y gasto por estudiante.
          </p>
        </a>
      </div>
    </section>
  `,
})
export class Admin {
  protected readonly usuario = inject(AuthService).usuario;
}
