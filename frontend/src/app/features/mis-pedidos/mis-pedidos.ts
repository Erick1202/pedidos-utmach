import type { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, merge, of, Subject, switchMap, timer } from 'rxjs';
import { mensajeDeError } from '../../core/http/mensaje-error';
import type { Pedido } from '../../core/models/pedido';
import {
  CLASES_ESTADO,
  ETIQUETAS_ESTADO,
  INTERVALO_REFRESCO_MS,
  pedidosQuePasaronAListo,
  PUNTOS_ESTADO,
} from '../../core/pedidos/estados';
import { PedidosService } from '../../core/pedidos/pedidos.service';

@Component({
  selector: 'app-mis-pedidos',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './mis-pedidos.html',
})
export class MisPedidos {
  private readonly pedidosService = inject(PedidosService);
  private readonly recargar$ = new Subject<void>();

  protected readonly etiquetas = ETIQUETAS_ESTADO;
  protected readonly clases = CLASES_ESTADO;
  protected readonly puntos = PUNTOS_ESTADO;

  /** `null` mientras llega la primera respuesta. */
  protected readonly pedidos = signal<Pedido[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly actualizando = signal(false);
  /** Pedidos que pasaron a «listo» desde que se abrió la página. */
  protected readonly recienListos = signal<ReadonlySet<string>>(new Set());
  /** Pedido recién confirmado (viene de `/confirmar-pedido`). */
  protected readonly pedidoNuevo = inject(ActivatedRoute).snapshot.queryParamMap.get('nuevo');

  protected readonly cargando = computed(() => this.pedidos() === null && this.error() === null);

  constructor() {
    merge(timer(0, INTERVALO_REFRESCO_MS), this.recargar$)
      .pipe(
        switchMap(() => {
          this.actualizando.set(true);
          return this.pedidosService.misPedidos().pipe(
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
        if (!pedidos) {
          return;
        }

        const anteriores = this.pedidos();
        if (anteriores) {
          const nuevosListos = pedidosQuePasaronAListo(anteriores, pedidos);
          if (nuevosListos.length > 0) {
            this.recienListos.update((actuales) => new Set([...actuales, ...nuevosListos]));
          }
        }
        this.pedidos.set(pedidos);
      });
  }

  protected recargar(): void {
    this.recargar$.next();
  }

  protected descartarAviso(): void {
    this.recienListos.set(new Set());
  }
}
