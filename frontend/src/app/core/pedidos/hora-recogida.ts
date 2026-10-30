/**
 * Utilidades del selector de hora de recogida. Replican en el navegador la
 * regla del servidor (`validarHoraRecogida`): posterior a la hora actual y
 * entre las 07:00 y las 16:00 de Ecuador. La validación definitiva la hace la API.
 */

export const ZONA_HORARIA = 'America/Guayaquil';
/** Ecuador continental no usa horario de verano: siempre UTC-5. */
const DESFASE_ECUADOR = '-05:00';
export const HORA_APERTURA = '07:00';
export const HORA_CIERRE = '16:00';

const formatoFecha = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Fecha de hoy en Ecuador con formato `AAAA-MM-DD`. */
export function fechaHoyEcuador(ahora: Date): string {
  return formatoFecha.format(ahora);
}

/** Convierte `HH:mm` de hoy en Ecuador en un instante absoluto. */
export function construirHoraRecogida(hora: string, ahora: Date): Date {
  return new Date(`${fechaHoyEcuador(ahora)}T${hora}:00${DESFASE_ECUADOR}`);
}

/** Devuelve el mensaje de error en español o `null` si la hora es válida. */
export function validarHoraSeleccionada(hora: string, ahora: Date): string | null {
  if (!/^\d{2}:\d{2}$/.test(hora)) {
    return 'Elige una hora de recogida.';
  }

  if (hora < HORA_APERTURA || hora > HORA_CIERRE) {
    return 'La hora de recogida debe estar entre las 07:00 y las 16:00.';
  }

  if (construirHoraRecogida(hora, ahora).getTime() <= ahora.getTime()) {
    return 'La hora de recogida debe ser posterior a la hora actual.';
  }

  return null;
}
