import { rangoRapido, validarRango } from './rangos';

describe('rangoRapido', () => {
  // 30 de octubre de 2026 a las 22:00 en Ecuador (ya es 31 en UTC).
  const AHORA = new Date('2026-10-31T03:00:00Z');

  it('«Todo» no filtra', () => {
    expect(rangoRapido('todo', AHORA)).toEqual({});
  });

  it('«Últimos 7 días» incluye hoy en Ecuador', () => {
    expect(rangoRapido('semana', AHORA)).toEqual({ desde: '2026-10-24', hasta: '2026-10-30' });
  });

  it('«Este mes» va del día 1 a hoy en Ecuador', () => {
    expect(rangoRapido('mes', AHORA)).toEqual({ desde: '2026-10-01', hasta: '2026-10-30' });
  });

  it('cruza el cambio de mes al restar días', () => {
    expect(rangoRapido('semana', new Date('2026-11-03T15:00:00Z'))).toEqual({
      desde: '2026-10-28',
      hasta: '2026-11-03',
    });
  });
});

describe('validarRango', () => {
  it('acepta rangos abiertos o en orden', () => {
    expect(validarRango({})).toBeNull();
    expect(validarRango({ desde: '2026-10-01' })).toBeNull();
    expect(validarRango({ desde: '2026-10-01', hasta: '2026-10-01' })).toBeNull();
  });

  it('rechaza desde posterior a hasta', () => {
    expect(validarRango({ desde: '2026-10-02', hasta: '2026-10-01' })).toContain('posterior');
  });
});
