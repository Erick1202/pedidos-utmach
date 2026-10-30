import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CANTIDAD_MAXIMA,
  CANTIDAD_MINIMA,
  CarritoService,
} from '../../core/carrito/carrito.service';

@Component({
  selector: 'app-carrito',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './carrito.html',
})
export class Carrito {
  protected readonly carrito = inject(CarritoService);
  protected readonly cantidadMinima = CANTIDAD_MINIMA;
  protected readonly cantidadMaxima = CANTIDAD_MAXIMA;
  protected readonly imagenesFallidas = signal<ReadonlySet<string>>(new Set());

  protected cambiar(productoId: string, cantidad: number): void {
    this.carrito.cambiarCantidad(productoId, cantidad);
  }

  /** El servicio acota el valor; se refleja en el campo aunque la señal no cambie. */
  protected escribir(productoId: string, evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    this.carrito.cambiarCantidad(productoId, campo.valueAsNumber);
    campo.value = String(this.carrito.cantidadDe(productoId));
  }

  protected quitar(productoId: string): void {
    this.carrito.quitar(productoId);
  }

  protected marcarImagenFallida(id: string): void {
    this.imagenesFallidas.update((actuales) => new Set(actuales).add(id));
  }
}
