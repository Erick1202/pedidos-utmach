import type { RangoFechas } from '../models/reporte';
import { fechaHoyEcuador } from '../pedidos/hora-recogida';

export type RangoRapido = 'todo' | 'semana' | 'mes';

/** Resta días a una fecha `AAAA-MM-DD` sin depender de la zona del navegador. */
function restarDias(fecha: string, dias: number): string {
  const base = new Date(`${fecha}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() - dias);
  return base.toISOString().slice(0, 10);
}

/**
 * Rangos de los botones rápidos, con «hoy» en hora de Ecuador:
 * todo (sin filtro), últimos 7 días (hoy incluido) y el mes en curso.
 */
export function rangoRapido(tipo: RangoRapido, ahora: Date): RangoFechas {
  const hoy = fechaHoyEcuador(ahora);

  switch (tipo) {
    case 'todo':
      return {};
    case 'semana':
      return { desde: restarDias(hoy, 6), hasta: hoy };
    case 'mes':
      return { desde: `${hoy.slice(0, 8)}01`, hasta: hoy };
  }
}

/** Mensaje de error del filtro o `null` si el rango es válido. */
export function validarRango({ desde, hasta }: RangoFechas): string | null {
  if (desde && hasta && desde > hasta) {
    return 'La fecha «desde» no puede ser posterior a «hasta».';
  }
  return null;
}
