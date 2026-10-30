import { Injectable } from '@angular/core';
import type { Usuario } from '../models/usuario';

const CLAVE_TOKEN = 'pedidos_utmach_token';
const CLAVE_USUARIO = 'pedidos_utmach_usuario';

/**
 * Guarda la sesión en localStorage. No depende de HttpClient para que el
 * interceptor pueda leer el token sin crear un ciclo de dependencias.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  obtenerUsuario(): Usuario | null {
    const valor = localStorage.getItem(CLAVE_USUARIO);
    if (!valor) {
      return null;
    }

    try {
      const usuario = JSON.parse(valor) as Usuario;
      return usuario && typeof usuario._id === 'string' ? usuario : null;
    } catch {
      return null;
    }
  }

  guardarSesion(token: string, usuario: Usuario): void {
    localStorage.setItem(CLAVE_TOKEN, token);
    this.guardarUsuario(usuario);
  }

  guardarUsuario(usuario: Usuario): void {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
  }

  limpiar(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  }
}
