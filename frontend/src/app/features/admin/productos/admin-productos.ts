import type { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CategoriasService } from '../../../core/catalogo/categorias.service';
import { ProductosService } from '../../../core/catalogo/productos.service';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import type { Categoria, DatosProducto, Producto } from '../../../core/models/catalogo';

const URL_HTTP = /^https?:\/\/\S+$/i;

@Component({
  selector: 'app-admin-productos',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-productos.html',
})
export class AdminProductos {
  private readonly fb = inject(FormBuilder);
  private readonly productosService = inject(ProductosService);
  private readonly categoriasService = inject(CategoriasService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  /** `null`: formulario cerrado; `'nuevo'`: creando; id: editando. */
  protected readonly edicion = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorFormulario = signal<string | null>(null);
  protected readonly enProceso = signal<ReadonlySet<string>>(new Set());

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    descripcion: ['', [Validators.maxLength(500)]],
    precio: [0, [Validators.required, Validators.min(0.01), Validators.max(1000)]],
    imagenUrl: ['', [Validators.pattern(URL_HTTP)]],
    disponible: [true],
    categoriaId: ['', [Validators.required]],
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      productos: this.productosService.listar({ todos: true }),
      categorias: this.categoriasService.listar(),
    }).subscribe({
      next: ({ productos, categorias }) => {
        this.productos.set(productos);
        this.categorias.set(categorias);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  protected nuevo(): void {
    this.formulario.reset({
      nombre: '',
      descripcion: '',
      precio: 0,
      imagenUrl: '',
      disponible: true,
      categoriaId: this.categorias()[0]?._id ?? '',
    });
    this.abrirFormulario('nuevo');
  }

  protected editar(producto: Producto): void {
    this.formulario.reset({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagenUrl: producto.imagenUrl ?? '',
      disponible: producto.disponible,
      categoriaId: producto.categoria._id,
    });
    this.abrirFormulario(producto._id);
  }

  protected cancelar(): void {
    this.edicion.set(null);
    this.errorFormulario.set(null);
  }

  protected guardar(): void {
    this.errorFormulario.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos: DatosProducto = {
      ...valores,
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim(),
      imagenUrl: valores.imagenUrl.trim(),
      precio: Number(valores.precio),
    };
    const id = this.edicion();
    const peticion =
      id && id !== 'nuevo'
        ? this.productosService.actualizar(id, datos)
        : this.productosService.crear(datos);

    this.guardando.set(true);
    peticion.subscribe({
      next: (producto) => {
        this.guardando.set(false);
        this.edicion.set(null);
        this.productos.update((lista) =>
          id === 'nuevo'
            ? [...lista, producto].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
            : lista.map((actual) => (actual._id === producto._id ? producto : actual)),
        );
        this.aviso.set(id === 'nuevo' ? 'Producto creado.' : 'Producto actualizado.');
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errorFormulario.set(mensajeDeError(error));
      },
    });
  }

  protected alternarDisponible(producto: Producto): void {
    this.marcarEnProceso(producto._id, true);
    this.error.set(null);

    this.productosService.cambiarDisponibilidad(producto._id, !producto.disponible).subscribe({
      next: (actualizado) => {
        this.marcarEnProceso(producto._id, false);
        this.productos.update((lista) =>
          lista.map((actual) => (actual._id === actualizado._id ? actualizado : actual)),
        );
      },
      error: (error: HttpErrorResponse) => {
        this.marcarEnProceso(producto._id, false);
        this.error.set(mensajeDeError(error));
      },
    });
  }

  protected eliminar(producto: Producto): void {
    if (!confirm(`¿Eliminar «${producto.nombre}»? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.marcarEnProceso(producto._id, true);
    this.error.set(null);

    this.productosService.eliminar(producto._id).subscribe({
      next: () => {
        this.marcarEnProceso(producto._id, false);
        this.productos.update((lista) => lista.filter((actual) => actual._id !== producto._id));
        if (this.edicion() === producto._id) {
          this.edicion.set(null);
        }
        this.aviso.set('Producto eliminado.');
      },
      error: (error: HttpErrorResponse) => {
        this.marcarEnProceso(producto._id, false);
        this.error.set(mensajeDeError(error));
      },
    });
  }

  protected invalido(campo: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  private abrirFormulario(modo: string): void {
    this.aviso.set(null);
    this.errorFormulario.set(null);
    this.edicion.set(modo);
    // El formulario está arriba de la lista: en móvil hay que volver a verlo.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private marcarEnProceso(id: string, activo: boolean): void {
    this.enProceso.update((actuales) => {
      const siguientes = new Set(actuales);
      if (activo) {
        siguientes.add(id);
      } else {
        siguientes.delete(id);
      }
      return siguientes;
    });
  }
}
