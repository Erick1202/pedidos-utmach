import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, map, Observable, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Credenciales, DatosRegistro, RespuestaSesion, Usuario } from '../models/usuario';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly almacenamiento = inject(TokenStorageService);

  private readonly _usuario = signal<Usuario | null>(this.almacenamiento.obtenerUsuario());

  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);
  readonly esAdmin = computed(() => this._usuario()?.rol === 'admin');

  iniciarSesion(credenciales: Credenciales): Observable<Usuario> {
    return this.http.post<RespuestaSesion>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      tap((respuesta) => this.guardarSesion(respuesta)),
      map((respuesta) => respuesta.usuario),
    );
  }

  registrar(datos: DatosRegistro): Observable<Usuario> {
    return this.http.post<RespuestaSesion>(`${environment.apiUrl}/auth/registro`, datos).pipe(
      tap((respuesta) => this.guardarSesion(respuesta)),
      map((respuesta) => respuesta.usuario),
    );
  }

  cerrarSesion(): void {
    this.almacenamiento.limpiar();
    this._usuario.set(null);
  }

  /**
   * Se ejecuta al arrancar la aplicación: valida el token guardado contra la
   * API y actualiza los datos del usuario. Si falla, la sesión se descarta.
   */
  async restaurarSesion(): Promise<void> {
    const token = this.almacenamiento.obtenerToken();

    if (!token) {
      this._usuario.set(null);
      return;
    }

    try {
      const respuesta = await firstValueFrom(
        this.http
          .get<{ usuario: Usuario }>(`${environment.apiUrl}/auth/perfil`)
          .pipe(timeout(5000)),
      );

      this._usuario.set(respuesta.usuario);
      this.almacenamiento.guardarUsuario(respuesta.usuario);
    } catch {
      this.cerrarSesion();
    }
  }

  private guardarSesion({ token, usuario }: RespuestaSesion): void {
    this.almacenamiento.guardarSesion(token, usuario);
    this._usuario.set(usuario);
  }
}
