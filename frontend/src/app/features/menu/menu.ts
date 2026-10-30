import type { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CategoriasService } from '../../core/catalogo/categorias.service';
import { ProductosService } from '../../core/catalogo/productos.service';
import { mensajeDeError } from '../../core/http/mensaje-error';
import type { Categoria, Producto } from '../../core/models/catalogo';

@Component({
  selector: 'app-menu',
  imports: [CurrencyPipe],
  templateUrl: './menu.html',
})
export class Menu {
  private readonly productosService = inject(ProductosService);
  private readonly categoriasService = inject(CategoriasService);

  protected readonly usuario = inject(AuthService).usuario;

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly categoriaSeleccionada = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly imagenesFallidas = signal<ReadonlySet<string>>(new Set());

  /** Cambia para forzar una nueva petición con los mismos filtros. */
  private readonly reintentos = signal(0);

  protected readonly hayFiltros = computed(
    () => this.categoriaSeleccionada() !== null || this.busqueda().trim() !== '',
  );

  constructor() {
    this.categoriasService
      .listar()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (categorias) => this.categorias.set(categorias),
        // Sin chips el menú sigue funcionando; el error principal lo muestra el listado.
        error: () => this.categorias.set([]),
      });

    const busqueda$ = toObservable(this.busqueda).pipe(
      map((texto) => texto.trim()),
      debounceTime(300),
      distinctUntilChanged(),
    );

    combineLatest([toObservable(this.categoriaSeleccionada), busqueda$, toObservable(this.reintentos)])
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap(([categoria, q]) =>
          this.productosService.listar({ categoria, q }).pipe(
            catchError((error: HttpErrorResponse) => {
              this.error.set(mensajeDeError(error));
              return of<Producto[]>([]);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((productos) => {
        this.productos.set(productos);
        this.cargando.set(false);
      });
  }

  protected seleccionarCategoria(id: string | null): void {
    this.categoriaSeleccionada.set(id);
  }

  protected buscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected limpiarFiltros(): void {
    this.categoriaSeleccionada.set(null);
    this.busqueda.set('');
  }

  protected reintentar(): void {
    this.reintentos.update((valor) => valor + 1);
  }

  protected marcarImagenFallida(id: string): void {
    this.imagenesFallidas.update((actuales) => new Set(actuales).add(id));
  }
}
