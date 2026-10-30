import type { HttpErrorResponse } from '@angular/common/http';

/** Obtiene el mensaje en español que devuelve la API o uno de respaldo. */
export function mensajeDeError(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Verifica que la API esté disponible.';
  }

  const cuerpo = error.error as { error?: unknown } | null;
  if (cuerpo && typeof cuerpo.error === 'string') {
    return cuerpo.error;
  }

  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
