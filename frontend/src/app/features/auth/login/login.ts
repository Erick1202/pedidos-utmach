import type { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { mensajeDeError } from '../../../core/http/mensaje-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
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

    this.auth.iniciarSesion(this.formulario.getRawValue()).subscribe({
      next: (usuario) => {
        this.cargando.set(false);
        void this.router.navigate([usuario.rol === 'admin' ? '/admin' : '/menu']);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }
}
