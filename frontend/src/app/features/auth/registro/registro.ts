import type { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { mensajeDeError } from '../../../core/http/mensaje-error';

const CONTRASENA_SEGURA = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).*$/;

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
})
export class Registro {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
        Validators.pattern(CONTRASENA_SEGURA),
      ],
    ],
  });

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mostrarPassword = signal(false);

  protected enviar(): void {
    this.error.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);

    this.auth.registrar(this.formulario.getRawValue()).subscribe({
      next: () => {
        this.cargando.set(false);
        void this.router.navigate(['/menu']);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }
}
