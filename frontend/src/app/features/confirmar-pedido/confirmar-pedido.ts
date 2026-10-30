import type { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../core/carrito/carrito.service';
import { mensajeDeError } from '../../core/http/mensaje-error';
import {
  construirHoraRecogida,
  HORA_APERTURA,
  HORA_CIERRE,
  validarHoraSeleccionada,
} from '../../core/pedidos/hora-recogida';
import { PedidosService } from '../../core/pedidos/pedidos.service';

@Component({
  selector: 'app-confirmar-pedido',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './confirmar-pedido.html',
})
export class ConfirmarPedido {
  private readonly pedidosService = inject(PedidosService);
  private readonly router = inject(Router);

  protected readonly carrito = inject(CarritoService);
  protected readonly horaApertura = HORA_APERTURA;
  protected readonly horaCierre = HORA_CIERRE;

  protected readonly hora = signal('');
  protected readonly errorHora = signal<string | null>(null);
  protected readonly errorApi = signal<string | null>(null);
  protected readonly enviando = signal(false);

  /** Si ni siquiera las 16:00 de hoy son futuras, hoy ya no se reciben pedidos. */
  protected readonly barCerrado = signal(validarHoraSeleccionada(HORA_CIERRE, new Date()) !== null);

  protected elegirHora(evento: Event): void {
    this.hora.set((evento.target as HTMLInputElement).value);
    this.errorHora.set(null);
  }

  protected confirmar(): void {
    this.errorApi.set(null);

    const ahora = new Date();
    const error = validarHoraSeleccionada(this.hora(), ahora);
    this.errorHora.set(error);
    if (error || this.carrito.vacio()) {
      return;
    }

    this.enviando.set(true);
    this.pedidosService
      .crear({
        items: this.carrito.lineas().map(({ productoId, cantidad }) => ({ productoId, cantidad })),
        horaRecogida: construirHoraRecogida(this.hora(), ahora).toISOString(),
      })
      .subscribe({
        next: (pedido) => {
          this.enviando.set(false);
          this.carrito.vaciar();
          void this.router.navigate(['/mis-pedidos'], { queryParams: { nuevo: pedido._id } });
        },
        error: (respuesta: HttpErrorResponse) => {
          this.enviando.set(false);
          this.errorApi.set(mensajeDeError(respuesta));
        },
      });
  }
}
