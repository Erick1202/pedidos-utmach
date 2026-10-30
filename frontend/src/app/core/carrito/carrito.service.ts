import { computed, Injectable, signal } from '@angular/core';
import type { Producto } from '../models/catalogo';
import type { LineaCarrito } from '../models/pedido';

const CLAVE_CARRITO = 'pedidos_utmach_carrito';
export const CANTIDAD_MINIMA = 1;
export const CANTIDAD_MAXIMA = 20;

/** Entero dentro del rango permitido por el validador de `pedidos` (1..20). */
function acotarCantidad(cantidad: number): number {
  const entera = Number.isFinite(cantidad) ? Math.trunc(cantidad) : CANTIDAD_MINIMA;
  return Math.min(CANTIDAD_MAXIMA, Math.max(CANTIDAD_MINIMA, entera));
}

function esLineaValida(valor: unknown): valor is LineaCarrito {
  const linea = valor as Partial<LineaCarrito> | null;
  return (
    !!linea &&
    typeof linea.productoId === 'string' &&
    typeof linea.nombre === 'string' &&
    typeof linea.precio === 'number' &&
    typeof linea.cantidad === 'number'
  );
}

/**
 * Carrito del estudiante con signals, persistido en localStorage después de
 * cada cambio. Los datos corruptos se descartan al iniciar.
 */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly _lineas = signal<LineaCarrito[]>(this.leer());

  readonly lineas = this._lineas.asReadonly();
  readonly cantidadItems = computed(() =>
    this._lineas().reduce((suma, linea) => suma + linea.cantidad, 0),
  );
  readonly total = computed(
    () =>
      Math.round(
        this._lineas().reduce((suma, linea) => suma + linea.precio * linea.cantidad, 0) * 100,
      ) / 100,
  );
  readonly vacio = computed(() => this._lineas().length === 0);

  /** Agrega una unidad del producto (hasta 20 por línea). */
  agregar(producto: Producto): void {
    const existente = this._lineas().find((linea) => linea.productoId === producto._id);

    if (existente) {
      this.cambiarCantidad(producto._id, existente.cantidad + 1);
      return;
    }

    this.guardar([
      ...this._lineas(),
      {
        productoId: producto._id,
        nombre: producto.nombre,
        precio: producto.precio,
        ...(producto.imagenUrl ? { imagenUrl: producto.imagenUrl } : {}),
        cantidad: CANTIDAD_MINIMA,
      },
    ]);
  }

  quitar(productoId: string): void {
    this.guardar(this._lineas().filter((linea) => linea.productoId !== productoId));
  }

  cambiarCantidad(productoId: string, cantidad: number): void {
    this.guardar(
      this._lineas().map((linea) =>
        linea.productoId === productoId ? { ...linea, cantidad: acotarCantidad(cantidad) } : linea,
      ),
    );
  }

  cantidadDe(productoId: string): number {
    return this._lineas().find((linea) => linea.productoId === productoId)?.cantidad ?? 0;
  }

  vaciar(): void {
    this.guardar([]);
  }

  private guardar(lineas: LineaCarrito[]): void {
    this._lineas.set(lineas);
    try {
      if (lineas.length === 0) {
        localStorage.removeItem(CLAVE_CARRITO);
      } else {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(lineas));
      }
    } catch {
      // Sin almacenamiento (modo privado o cuota llena) el carrito sigue en memoria.
    }
  }

  private leer(): LineaCarrito[] {
    try {
      const valor = JSON.parse(localStorage.getItem(CLAVE_CARRITO) ?? '[]') as unknown;
      return Array.isArray(valor)
        ? valor
            .filter(esLineaValida)
            .map((linea) => ({ ...linea, cantidad: acotarCantidad(linea.cantidad) }))
        : [];
    } catch {
      return [];
    }
  }
}
