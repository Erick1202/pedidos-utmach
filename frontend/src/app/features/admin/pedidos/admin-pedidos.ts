import type { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, merge, of, Subject, switchMap, timer } from 'rxjs';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import type { EstadoPedido, Pedido } from '../../../core/models/pedido';
import {
  accionSiguiente,
  CLASES_ESTADO,
  ESTADOS_ACTIVOS,
  ETIQUETAS_ESTADO,
  INTERVALO_REFRESCO_MS,
} from '../../../core/pedidos/estados';
import { fechaHoyEcuador } from '../../../core/pedidos/hora-recogida';
import { PedidosService } from '../../../core/pedidos/pedidos.service';

@Component({
  selector: 'app-admin-pedidos',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './admin-pedidos.html',
})
export class AdminPedidos {
  private readonly pedidosService = inject(PedidosService);
  private readonly recargar$ = new Subject<void>();

  protected readonly etiquetas = ETIQUETAS_ESTADO;
  protected readonly clases = CLASES_ESTADO;
  protected readonly accionSiguiente = accionSiguiente;

  /** Día de recogida en Ecuador (`AAAA-MM-DD`); vacío muestra todos los activos. */
  protected readonly fecha = signal(fechaHoyEcuador(new Date()));
  protected readonly pedidos = signal<Pedido[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly actualizando = signal(false);
  /** Id del pedido cuyo cambio de estado está en curso. */
  protected readonly avanzando = signal<string | null>(null);

  protected readonly cargando = computed(() => this.pedidos() === null && this.error() === null);

  protected readonly columnas = computed(() => {
    const lista = this.pedidos() ?? [];
    return ESTADOS_ACTIVOS.map((estado: EstadoPedido) => ({
      estado,
      pedidos: lista.filter((pedido) => pedido.estado === estado),
    }));
  });

  constructor() {
    merge(timer(0, INTERVALO_REFRESCO_MS), this.recargar$)
      .pipe(
        switchMap(() => {
          this.actualizando.set(true);
          return this.pedidosService.activos(this.fecha() || undefined).pipe(
            map((pedidos) => ({ pedidos, error: null })),
            catchError((respuesta: HttpErrorResponse) =>
              of({ pedidos: null, error: mensajeDeError(respuesta) }),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ pedidos, error }) => {
        this.actualizando.set(false);
        this.error.set(error);
        if (pedidos) {
          this.pedidos.set(pedidos);
        }
      });
  }

  protected cambiarFecha(evento: Event): void {
    this.fecha.set((evento.target as HTMLInputElement).value);
    this.pedidos.set(null);
    this.recargar();
  }

  protected verHoy(): void {
    this.fecha.set(fechaHoyEcuador(new Date()));
    this.pedidos.set(null);
    this.recargar();
  }

  protected recargar(): void {
    this.recargar$.next();
  }

  protected avanzar(pedido: Pedido): void {
    this.aviso.set(null);
    this.error.set(null);
    this.avanzando.set(pedido._id);

    this.pedidosService.avanzarEstado(pedido._id).subscribe({
      next: (actualizado) => {
        this.avanzando.set(null);
        // «Entregado» sale del tablero; los demás cambian de columna.
        this.pedidos.update((lista) =>
          (lista ?? [])
            .map((item) => (item._id === actualizado._id ? actualizado : item))
            .filter((item) => item.estado !== 'entregado'),
        );
      },
      error: (respuesta: HttpErrorResponse) => {
        this.avanzando.set(null);
        if (respuesta.status === 409) {
          this.aviso.set(
            `El pedido de ${pedido.usuario.nombre} ya había cambiado de estado. Se actualizó el tablero.`,
          );
          this.recargar();
          return;
        }
        this.error.set(mensajeDeError(respuesta));
      },
    });
  }
}
