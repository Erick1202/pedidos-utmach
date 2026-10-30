import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-menu',
  template: `
    <section class="space-y-6">
      <div
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-utmach-azul to-utmach-azul-claro p-6 text-white shadow-xl shadow-blue-900/15 sm:p-8"
      >
        <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div class="relative">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Bar UTMACH</p>
          <h1 class="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Hola, {{ usuario()?.nombre }}
          </h1>
          <p class="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">
            Tu sesión está activa. El catálogo de productos y el carrito llegarán en la siguiente
            fase.
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-wide text-utmach-azul-claro">
            Próximamente
          </p>
          <h2 class="mt-2 text-lg font-bold text-slate-900">Menú y carrito</h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">
            Aquí verás los desayunos y almuerzos disponibles, podrás agregarlos al carrito y elegir
            la hora de recogida.
          </p>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-wide text-utmach-azul-claro">Tu cuenta</p>
          <h2 class="mt-2 text-lg font-bold text-slate-900">{{ usuario()?.nombre }}</h2>
          <dl class="mt-3 space-y-1 text-sm text-slate-500">
            <div class="flex flex-wrap gap-x-2">
              <dt class="font-semibold text-slate-700">Correo:</dt>
              <dd class="break-all">{{ usuario()?.email }}</dd>
            </div>
            <div class="flex flex-wrap gap-x-2">
              <dt class="font-semibold text-slate-700">Rol:</dt>
              <dd>{{ usuario()?.rol === 'admin' ? 'Administrador' : 'Estudiante' }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  `,
})
export class Menu {
  protected readonly usuario = inject(AuthService).usuario;
}
