import { construirHoraRecogida, fechaHoyEcuador, validarHoraSeleccionada } from './hora-recogida';

/** 09:00 del 29 de octubre de 2026 en Ecuador. */
const AHORA = new Date('2026-10-29T14:00:00Z');

describe('hora de recogida', () => {
  it('obtiene la fecha de hoy en Ecuador aunque en UTC ya sea mañana', () => {
    // 23:30 del 29 en Ecuador = 04:30Z del 30
    expect(fechaHoyEcuador(new Date('2026-10-30T04:30:00Z'))).toBe('2026-10-29');
  });

  it('construye el instante con el desfase de Ecuador', () => {
    expect(construirHoraRecogida('12:30', AHORA).toISOString()).toBe('2026-10-29T17:30:00.000Z');
  });

  it('acepta una hora futura entre las 07:00 y las 16:00', () => {
    expect(validarHoraSeleccionada('12:30', AHORA)).toBeNull();
    expect(validarHoraSeleccionada('16:00', AHORA)).toBeNull();
  });

  it('rechaza una hora vacía, fuera de horario o pasada', () => {
    expect(validarHoraSeleccionada('', AHORA)).toBe('Elige una hora de recogida.');
    expect(validarHoraSeleccionada('06:59', AHORA)).toContain('entre las 07:00 y las 16:00');
    expect(validarHoraSeleccionada('16:01', AHORA)).toContain('entre las 07:00 y las 16:00');
    expect(validarHoraSeleccionada('08:30', AHORA)).toContain('posterior a la hora actual');
  });
});
