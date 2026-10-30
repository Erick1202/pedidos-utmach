import type { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Observable } from 'rxjs';
import { CategoriasService } from '../../../core/catalogo/categorias.service';
import { mensajeDeError } from '../../../core/http/mensaje-error';
import type { Categoria } from '../../../core/models/catalogo';

const validadoresNombre = [Validators.required, Validators.minLength(3), Validators.maxLength(50)];

@Component({
  selector: 'app-admin-categorias',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-categorias.html',
})
export class AdminCategorias {
  private readonly servicio = inject(CategoriasService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly ocupado = signal(false);

  protected readonly nuevoNombre = new FormControl('', {
    nonNullable: true,
    validators: validadoresNombre,
  });
  protected readonly nombreEditado = new FormControl('', {
    nonNullable: true,
    validators: validadoresNombre,
  });
  protected readonly editandoId = signal<string | null>(null);

  /**
   * `(ngSubmit)` solo existe con una directiva de formulario: sin `[formGroup]`
   * el envío nativo recarga la página y nunca llega a `crear()` ni a `guardarEdicion()`.
   */
  protected readonly formularioNuevo = new FormGroup({ nombre: this.nuevoNombre });
  protected readonly formularioEdicion = new FormGroup({ nombre: this.nombreEditado });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.servicio.listar().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  protected crear(): void {
    if (this.nuevoNombre.invalid) {
      this.nuevoNombre.markAsTouched();
      return;
    }

    this.ejecutar(this.servicio.crear(this.nuevoNombre.value.trim()), (categoria) => {
      this.categorias.update((lista) => ordenar([...lista, categoria]));
      this.nuevoNombre.reset();
      this.aviso.set(`Categoría «${categoria.nombre}» creada.`);
    });
  }

  protected editar(categoria: Categoria): void {
    this.limpiarMensajes();
    this.nombreEditado.reset(categoria.nombre);
    this.editandoId.set(categoria._id);
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
  }

  protected guardarEdicion(categoria: Categoria): void {
    if (this.nombreEditado.invalid) {
      this.nombreEditado.markAsTouched();
      return;
    }

    this.ejecutar(
      this.servicio.actualizar(categoria._id, this.nombreEditado.value.trim()),
      (actualizada) => {
        this.categorias.update((lista) =>
          ordenar(lista.map((actual) => (actual._id === actualizada._id ? actualizada : actual))),
        );
        this.editandoId.set(null);
        this.aviso.set('Categoría actualizada. Los productos muestran el nuevo nombre.');
      },
    );
  }

  protected eliminar(categoria: Categoria): void {
    if (!confirm(`¿Eliminar la categoría «${categoria.nombre}»?`)) {
      return;
    }

    this.ejecutar(this.servicio.eliminar(categoria._id), () => {
      this.categorias.update((lista) => lista.filter((actual) => actual._id !== categoria._id));
      this.aviso.set(`Categoría «${categoria.nombre}» eliminada.`);
    });
  }

  private ejecutar<T>(peticion: Observable<T>, alTerminar: (resultado: T) => void): void {
    this.limpiarMensajes();
    this.ocupado.set(true);

    peticion.subscribe({
      next: (resultado) => {
        this.ocupado.set(false);
        alTerminar(resultado);
      },
      error: (error: HttpErrorResponse) => {
        this.ocupado.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }

  private limpiarMensajes(): void {
    this.error.set(null);
    this.aviso.set(null);
  }
}

function ordenar(categorias: Categoria[]): Categoria[] {
  return [...categorias].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
