import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin',
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
            Bienvenido, {{ usuario()?.nombre }}. Solo los administradores pueden ver esta sección.
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-wide text-utmach-azul-claro">
            Próximamente
          </p>
          <h2 class="mt-2 text-lg font-bold text-slate-900">Gestión de pedidos</h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">
            Aquí podrás recibir pedidos, actualizar su estado y consultar los reportes del bar.
          </p>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-wide text-utmach-azul-claro">Seguridad</p>
          <h2 class="mt-2 text-lg font-bold text-slate-900">Acceso verificado</h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">
            Esta ruta está protegida por el guard de administrador. Un estudiante que intente
            abrirla será redirigido al menú.
          </p>
        </article>
      </div>
    </section>
  `,
})
export class Admin {
  protected readonly usuario = inject(AuthService).usuario;
}
